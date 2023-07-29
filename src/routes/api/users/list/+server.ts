import type { SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getRoles, getSpecifiedRoles } from "$lib/Roles/role.server";
import { error, json } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";

export const POST = (async ({ request, locals, cookies }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(403, "AUTHORIZATION REQUIRED"); }
    
    const db = firebaseAdmin.getFirestore();

    const docs = (await db.collection('users').where('team', '==', locals.firestoreUser.team).get());

    let users = new Array<SecondaryUser>();

    for(let i = 0; i < docs.docs.length; i++) {
        users.push({
            photoURL: docs.docs[i].data().photoURL,
            displayName: docs.docs[i].data().displayName,
            team: docs.docs[i].data().team,
            pronouns: docs.docs[i].data().pronouns,
            id: docs.docs[i].id,
            role: docs.docs[i].data().role,
            permissions: docs.docs[i].data().permissions,
            level: docs.docs[i].data().level,
            roles: await getSpecifiedRoles(docs.docs[i].data().roles as DocumentReference[])
        })
    }

    if(users.length == 0) {
        return json({users: undefined});
    }

    return json({users: users});
});