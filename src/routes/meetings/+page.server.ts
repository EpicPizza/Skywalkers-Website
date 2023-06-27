import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

export async function load({ locals, url, depends }) {
    depends("meeting:listings");

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

    interface MeetingPreview extends Meeting {
        signedup: boolean
    }

    const meetings = new Array<MeetingPreview>();

    for(let i = 0; i < firestoreMeetings.length; i++) {
        if(firestoreMeetings[i].data().name != "Default Meeting") {
            let signedup = false;

            for(let j = 0; j < firestoreMeetings[i].data().signups.length; j++) {
                if(firestoreMeetings[i].data().signups[j].id == locals.user.uid) {
                    signedup = true;
                }
            }

            meetings.push({
                name: firestoreMeetings[i].data().name as string,
                id: firestoreMeetings[i].id as string,
                location: firestoreMeetings[i].data().location as string,
                thumbnail: firestoreMeetings[i].data().thumbnail as string,
                when_start: firestoreMeetings[i].data().when_start.toDate() as Date,
                when_end: firestoreMeetings[i].data().when_end.toDate() as Date,
                signedup: signedup,
            })
        }
    }

    return { meetings: meetings, completed: url.searchParams.get("completed") === 'true' ? true : false };
}