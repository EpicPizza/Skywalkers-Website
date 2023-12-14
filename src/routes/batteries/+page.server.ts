export const ssr = false;

import { message, superValidate } from "sveltekit-superforms/server";
import { AddBattery, type Battery } from '$lib/Batteries/batteries';
import { error, fail, redirect } from "@sveltejs/kit";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";

export async function load({ locals }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

    const database = firebaseAdmin.getFirestore();

    const ref = database.collection('teams').doc(locals.firestoreUser.team).collection('batteries');

    const docs = (await ref.get()).docs;

    const batteries: Battery[] = [];

    for(let i = 0; i < docs.length; i++) {
        let history: Battery["history"] = [];

        for(let j = 0; j < docs[i].data().history.length; j++) {
            history.push({
                author: docs[i].data().history[j].author,
                message: docs[i].data().history[j].message,
                timestamp: docs[i].data().history[j].timestamp.toDate(),
            })
        }

        history.sort(( a, b ) => b.timestamp.valueOf() - a.timestamp.valueOf() )

        batteries.push({
            condition: docs[i].data().condition,
            lastchecked: docs[i].data().lastchecked.toDate(),
            use: docs[i].data().use,
            code: docs[i].id,
            history: history,
        })
    }

    let form = await superValidate(AddBattery);

    return { form, batteries };
}

export const actions = {
    default: async function({ request, locals }) {
        if(locals.user == undefined) throw error(401, "Sign In Required");
        if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

        const form = await superValidate(request, AddBattery);

        if(!form.valid) {
            return fail(404, { form });
        }

        const database = firebaseAdmin.getFirestore();

        const ref = database.collection('teams').doc(locals.firestoreUser.team).collection('batteries');

        const docs = (await ref.get()).docs;

        const code = getNewCode(docs);

        ref.doc(code).set({
            condition: form.data.condition,
            lastchecked: form.data.lastchecked,
            use: form.data.use,
            history: [],
        })

        return message(form, "Battery Added");
    }
}

const getNewCode = (codes: DocumentSnapshot[]): string => {
    const code = getRandomCode();

    let found = false;

    for(let i = 0; i < codes.length; i++) {
        if(code == codes[i].id) {
            found = true;
        }
    }

    if(found) {
        return getRandomCode();
    } else {
        return code;
    }
}

const getRandomNumber = () => {
    return crypto.getRandomValues(new Uint32Array(1))[0]/2**32;
}

const getRandomCode = () => {
    let code = "";

    for(let i = 0; i < 3; i++) {
        code += Math.floor(getRandomNumber() * 9 + 1);
    }

    return code;
}