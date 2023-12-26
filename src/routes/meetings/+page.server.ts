import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getFetchedMeetingsOptimized, type FetchedMeeting } from "$lib/Meetings/helpers.server";
import { getMemberCache } from "$lib/Members/manage.server.js";
import { getRolesAsCache } from "$lib/Roles/role.server";
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

    const roles = await getRolesAsCache(locals.firestoreUser.team);
    const members = await getMemberCache(locals.firestoreUser.team, roles);
    const meetings = await getFetchedMeetingsOptimized(ref, locals.user.uid, locals.firestoreUser.team, members, roles);
    
    console.log(meetings);

    return { 
        meetings: meetings as unknown as FetchedMeeting[], 
        reachedEnd: (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', false).where('starts', '>=', today).count().get()).data().count == meetings.length, 
        meetingsShown: meetings.length, 
        loading: false, 
        completed: false, 
        deleted: url.searchParams.get("deleted") === 'true' ? true : false, 
    };
}