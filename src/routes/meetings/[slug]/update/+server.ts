import { type FetchedMeeting, getFetchedMeeting, getMeeting } from "$lib/Meetings/helpers.server";
import { error, json, redirect } from "@sveltejs/kit";

export async function GET({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");
    
    try {
        await getMeeting(params.slug, locals.user.uid, locals.firestoreUser.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            return json(e.message, { status: 404 });
        } else {
            console.log(e);
        }

        return json("An error occurred.", { status: 404 });
    }

    return json("Meeting Checked");
}