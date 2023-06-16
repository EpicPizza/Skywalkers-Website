import type { FirestoreUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    const meeting = {
        name: data.name as string,
        lead: (await data.lead.get()).data() as FirestoreUser,
        synopsis: (await data.synopsis.get()).data() as FirestoreUser,
        mentor: (await data.mentor.get()).data() as FirestoreUser,
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        id: params.slug as string,
    }

    if(meeting.lead.team != locals.firestoreUser.team || meeting.synopsis.team != locals.firestoreUser.team || meeting.mentor.team != locals.firestoreUser.team) throw error(500, "Meeting Requested Inaccessible Resource");

    
    return { 
        meeting: meeting,
        status: {
            created: url.searchParams.get("created") === 'true' ? true : false,
            edited: url.searchParams.get("edited") === 'true' ? true : false,
        }
    };
}