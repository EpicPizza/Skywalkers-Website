import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('crew').doc('table');

    const data = (await ref.get()).data();

    if(data == undefined) {
        throw error(500, "Crew page not sent up.");
    }

    return { table: data.value };
}