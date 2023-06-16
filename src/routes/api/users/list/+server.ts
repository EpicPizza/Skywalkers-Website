import type { SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, json } from "@sveltejs/kit";

export const POST = (async ({ request, locals, cookies }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(403, "AUTHORIZATION REQUIRED"); }
    
    const db = firebaseAdmin.getFirestore();

    const docs = (await db.collection('users').where('team', '==', locals.firestoreUser.team).get());

    let users = new Array<SecondaryUser>();

    docs.forEach((snapshot) => {
        users.push({
            photoURL: snapshot.data().photoURL,
            displayName: snapshot.data().displayName,
            team: snapshot.data().team,
            id: snapshot.id,
            role: snapshot.data().role,
        })
    })

    if(users.length == 0) {
        return json({users: undefined});
    }

    return json({users: users});
});