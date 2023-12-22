import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getFetchedMeetings } from "$lib/Meetings/helpers.server";
import { error, redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    let today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', false).where('starts', '>=', today).orderBy('starts').limit(50);

    const meetings = await getFetchedMeetings(ref, locals.user.uid, locals.firestoreUser.team);

    console.log(meetings);
    
    return { 
        meetings: meetings, 
        reachedEnd: (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', false).where('starts', '>=', today).count().get()).data().count == meetings.length, 
        meetingsShown: meetings.length, 
        loading: false, 
        completed: false, 
        deleted: url.searchParams.get("deleted") === 'true' ? true : false, 
    };
}