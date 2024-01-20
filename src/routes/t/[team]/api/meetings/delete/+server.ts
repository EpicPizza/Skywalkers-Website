import { deleteMeetings } from "$lib/Meetings/helpers.server";
import { error, json } from "@sveltejs/kit";
import { z } from "zod";

const Delete = z.object({
    meetings: z.string().min(1).max(100).array().min(1).max(100),
})

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team == undefined || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); } 
    if(!locals.permissions.includes('DELETE_MEETINGS')) throw error(403);

    const req = Delete.parse(await request.json());

    try {
        await deleteMeetings(req.meetings, locals.user.uid, locals.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            return json(e.message);
        } else {
            console.log(e);
        }
    }

    return json("Meetings Deleted");
});