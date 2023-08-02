import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { completeSchema, duplicateSchema } from '$lib/Meetings/meetings.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';

export async function load({ locals, url }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);

    const firestoreMeetings: any = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', false).where('when_start', '>=', today).orderBy('when_start').limit(50).get()).docs;

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
                if(firestoreMeetings[i].data().signups[j] == locals.user.uid) {
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
    
    return { 
        meetings: meetings as MeetingPreview[], 
        reachedEnd: (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', false).where('when_start', '>=', today).count().get()).data().count == meetings.length, 
        meetingsShown: meetings.length, 
        loading: false, 
        completed: false, 
        deleted: url.searchParams.get("deleted") === 'true' ? true : false, 
    };
}