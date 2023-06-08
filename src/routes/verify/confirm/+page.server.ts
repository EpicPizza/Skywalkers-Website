import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { redirect } from '@sveltejs/kit';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import safeCompare from 'safe-compare';

export async function load({ locals }) {
    if(locals.user == undefined) throw redirect(307, "/?signin=true");

    if(locals.user.customClaims != undefined && locals.user.customClaims['team'] == true) {
        throw redirect(307, "/?alrverify=true");
    }

    const db = firebaseAdmin.getFirestore();

    const users = await db.collection('users').listDocuments();

    let found: false | string = false;
    for(let i = 0; i < users.length; i++) {
        if(safeCompare(locals.user.uid, users[i].id)) {
            let data = (await users[i].get()).data();
            console.log("Found", data);
            if(data != undefined) {
                found = data.verify;
            };
        }
    }

    if(found == false) {
        throw redirect(307, "/verify");
    } else {
        return { verify: { code: found } };
    }
}   