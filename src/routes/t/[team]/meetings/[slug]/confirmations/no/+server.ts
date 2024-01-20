import { type FetchedMeeting, getFetchedMeeting, getMeeting, type Meeting, markConfirmation } from "$lib/Meetings/helpers.server";
import { error, redirect } from "@sveltejs/kit";

export async function POST({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == undefined || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    let meeting: Meeting | false = false;
    
    try {
        meeting = await getMeeting(params.slug, locals.user.uid, locals.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

    if(meeting.completed) throw error(400, "Cannot add confirmation to completed meeting.");

    await markConfirmation(meeting, false, locals.user.uid, locals.team);

    return new Response("No Content", { status: 200 });
}