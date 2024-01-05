import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getFetchedMeetingsOptimized, type FetchedMeeting, getSynopses } from "$lib/Meetings/helpers.server";
import { getMemberCache } from "$lib/Members/manage.server";
import { getRolesAsCache } from "$lib/Roles/role.server";
import { error, redirect } from "@sveltejs/kit";


export async function load({ locals, url, params }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    let on = parseInt(params.slug);

    if(isNaN(on) || on < 1) throw error(400, "Invalid Page Number");

    let count = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', true).count().get()).data().count;
   
    if(on * 15 - 15 > count) throw error(400, "Invalid Page Number");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').where('completed', '==', true).orderBy('starts', 'desc').offset((on - 1) * 15).limit(15);

    const roles = await getRolesAsCache(locals.firestoreUser.team);
    const members = await getMemberCache(locals.firestoreUser.team, roles);
    const meetings = await getFetchedMeetingsOptimized(ref, locals.user.uid, locals.firestoreUser.team, members, roles);
    
    return { 
        meetings: meetings as FetchedMeeting[], 
        completed: true, 
        deleted: url.searchParams.get("deleted") === 'true' ? true : false,
        page: {
            total: {
                count: count,
                pages: Math.ceil(count / 15),
            },
            on: on, 
            beginning: on == 1,
            end: on >= Math.ceil(count / 15),
            showing: (meetings.length == 0 ? 0 : ((on - 1) * 15) + 1) + " - " + (count > on * 15 ? on * 15 : count),
        }
    };
}