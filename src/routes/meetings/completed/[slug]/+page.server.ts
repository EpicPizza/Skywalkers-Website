import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

export async function load({ locals, url, params }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    let on = parseInt(params.slug);

    if(isNaN(on) || on < 1) throw error(400, "Invalid Page Number");

    let count = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', true).count().get()).data().count;
   
    if(on * 50 - 50 > count) throw error(400, "Invalid Page Number");

    const firestoreMeetings: any = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', true).orderBy('when_start', 'desc').offset((on - 1) * 50).limit(50).get()).docs;

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
     
    return { 
        meetings: meetings as Meeting[], 
        completed: true, 
        deleted: url.searchParams.get("deleted") === 'true' ? true : false,
        page: {
            total: {
                count: count,
                pages: Math.ceil(count / 50),
            },
            on: on, 
            beginning: on == 1,
            end: on >= Math.ceil(count / 50),
            showing: ((on - 1) * 50) + " - " + (count > on * 50 ? on * 50 : count),
        }
    };
}

interface Meeting {
    name:  string,
    id: string,
    location: string,
    thumbnail:  string,
    when_start: Date,
    when_end: Date,
    signedup: boolean,
}