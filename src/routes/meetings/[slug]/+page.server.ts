import { type FetchedMeeting, getFetchedMeeting } from "$lib/Meetings/helpers.server";
import { error, redirect } from "@sveltejs/kit";

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    let meeting: FetchedMeeting | false = false;
    
    try {
        meeting = await getFetchedMeeting(params.slug, locals.user.uid, locals.firestoreUser.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

    return { 
        meeting: meeting,
        status: {
            created: url.searchParams.get("created") === 'true' ? true : false,
            edited: url.searchParams.get("edited") === 'true' ? true : false,
        }
    };
}