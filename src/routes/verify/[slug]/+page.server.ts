import type { Code } from '$lib/Codes/codes';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import { FieldValue } from 'firebase-admin/firestore';
import safeCompare from 'safe-compare';

export async function load({ locals, params }) {
    if(locals.firestoreUser != undefined) throw redirect(307, "/?alrverify=true")

    const id = params.slug;

    const db = firebaseAdmin.getFirestore();

    const teamsRef = db.collection('teams');

    const teams = (await teamsRef.get()).docs;

    let role: string | undefined = undefined;

    for(let i = 0; i < teams.length; i++) {
        const codes = new Map<string, Code>(Object.entries(teams[i].data()));

        codes.forEach((code) => {
            if(safeCompare(id, code.id)) {
                role = code.role;
            }
        })
    }

    if(role == undefined) throw error(404, "Not Found");
}

export const actions = {
    default: async function({ locals, params }) {
        if(locals.user == undefined) throw redirect(307, "/?signin=true")
        if(locals.firestoreUser != undefined) throw redirect(307, "/?alrverify=true")

        const id = params.slug;

        const db = firebaseAdmin.getFirestore();

        const teamsRef = db.collection('teams');

        const teams = (await teamsRef.get()).docs;

        let found: Code = undefined as unknown as Code;
        let member: string = undefined as unknown as string;
        let team: string = undefined as unknown as string;

        for(let i = 0; i < teams.length; i++) {
            const codes = new Map<string, Code>(Object.entries(teams[i].data()));

            codes.forEach((code, key) => {
                let exists = safeCompare(id, code.id);
                let anyone = safeCompare("anyone", code.access);
                let access = safeCompare(locals.user?.email as string, code.access);

                if(exists && (anyone || access)) {
                    found = code;
                    member = key;
                    team = teams[i].id;
                }
            })
        }

        if(found == undefined || team == undefined || member == undefined) throw error(400, "An error occurred. (Possibly wrong email)");

        await db.collection('teams').doc(team).update({
            [member]: FieldValue.delete(),
        });

        const users = await (db.collection('verify').where('code', '==', member + "-" + team).get());

        if(!users.empty) {
            users.forEach(async (doc) => {
                if(locals.user != undefined && doc.id != locals.user.uid) {
                    await doc.ref.delete();
                }
            })
        }

        db.collection('users').doc(locals.user.uid).set({
            displayName: locals.user.displayName,
            photoURL: locals.user.photoURL,
            team: team,
            role: found.role,
            roles: [],
            level: 0,
            pronouns: "",
        })

        throw redirect(307, "/?invalidateAll=true");
    }
}