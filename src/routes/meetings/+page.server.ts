import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const firestoreMeetings: any = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', url.searchParams.get("completed") === 'true' ? true : false).get()).docs;

    interface Meeting {
        name: string,
        id: string,
        location: string,
        thumbnail: string,
        when_start: Date,
        when_end: Date,
    }

    const meetings = new Array<Meeting>();

    for(let i = 0; i < firestoreMeetings.length; i++) {
        if(firestoreMeetings[i].data().name != "Default Meeting") {
            meetings.push({
                name: firestoreMeetings[i].data().name as string,
                id: firestoreMeetings[i].id as string,
                location: firestoreMeetings[i].data().location as string,
                thumbnail: firestoreMeetings[i].data().thumbnail as string,
                when_start: firestoreMeetings[i].data().when_start.toDate() as Date,
                when_end: firestoreMeetings[i].data().when_end.toDate() as Date
            })
        }
    }

    return { meetings: meetings, completed: url.searchParams.get("completed") === 'true' ? true : false };
}