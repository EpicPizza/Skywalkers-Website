import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getFetchedMeetings, type FetchedMeeting } from "$lib/Meetings/helpers.server";
import { error, redirect } from "@sveltejs/kit";

export async function load({ locals, url, params }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    let on = parseInt(params.slug);

    if(isNaN(on) || on < 1) throw error(400, "Invalid Page Number");

    let count = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', true).count().get()).data().count;
   
    if(on * 50 - 50 > count) throw error(400, "Invalid Page Number");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', true).orderBy('starts', 'desc').offset((on - 1) * 50).limit(50);

    const meetings = await getFetchedMeetings(ref, locals.user.uid, locals.firestoreUser.team);
     
    return { 
        meetings: meetings as FetchedMeeting[], 
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
            showing: (meetings.length == 0 ? 0 : ((on - 1) * 50) + 1) + " - " + (count > on * 50 ? on * 50 : count),
        }
    };
}