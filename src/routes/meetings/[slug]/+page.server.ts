import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { getRole, getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    let signups = new Array<SecondaryUser>();

    for(let i = 0; i < data.signups.length; i++) {
        const user = (await data.signups[i].get()).data();

        if(user != undefined) {
            signups.push({
                ...user,
                roles: await getSpecifiedRoles(user.roles),
                id: data.signups[i].id,
            } as SecondaryUser);
        }
    }

    let synopsis; 
    if(data.synopsis != null) {
        synopsis = await seralizeFirestoreUser((await data.synopsis.get()).data())
    }

    let mentor;
    if(data.mentor != null) {
        mentor = await seralizeFirestoreUser((await data.mentor.get()).data())
    }

    let role;
    if(data.role != null) {
        role = await getRole(data.role, locals.firestoreUser.team);
    }

    const meeting = {
        name: data.name as string,
        lead: await seralizeFirestoreUser((await data.lead.get()).data()),
        //@ts-ignore
        synopsis: data.synopsis == null ? undefined : synopsis == undefined ? "User Not Found" : synopsis,
        //@ts-ignore
        mentor: data.mentor == null ? undefined : mentor == undefined ? "User Not Found" :  mentor,
        role: role,
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        id: params.slug as string,
        signups: signups
    }

    if((meeting.lead != undefined && meeting.lead.team != locals.firestoreUser.team) || (typeof meeting.synopsis == 'object' && meeting.synopsis.team != locals.firestoreUser.team) || (typeof meeting.mentor == 'object' && meeting.mentor.team != locals.firestoreUser.team)) throw error(500, "Meeting Requested Inaccessible Resource");

    return { 
        meeting: meeting,
        status: {
            created: url.searchParams.get("created") === 'true' ? true : false,
            edited: url.searchParams.get("edited") === 'true' ? true : false,
        }
    };
}