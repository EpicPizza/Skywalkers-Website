import { OWNER } from "$env/static/private";
import { sendDM } from "$lib/Discord/discord.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { deleteEvent } from "$lib/Google/calendar.js";
import { getCalendar, getClient, getClientWithCrendentials } from "$lib/Google/client";
import { error, json } from "@sveltejs/kit";
import { message } from "sveltekit-superforms/server";
import { z } from "zod";

const Delete = z.object({
    meetings: z.string().min(1).max(100).array().min(1).max(100),
})

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); } 
    if(!locals.firestoreUser.permissions.includes('DELETE_MEETINGS')) throw error(403);

    const req = Delete.parse(await request.json());

    const db = firebaseAdmin.getFirestore();

    for(let i = 0; i < req.meetings.length; i++) {
        const ref = db.collection("teams").doc(locals.firestoreUser.team).collection("meetings").doc(req.meetings[i]);

        const doc = await ref.get();

        if(!doc.exists) {
            continue;
        }

        const id = doc.data()?.calendar;

        const client = await getClientWithCrendentials();

        const calendar = await getCalendar();

        if(client == undefined) {
            await sendDM("Authorization Needed", OWNER);

            return json("Google calendar integration down.");
        }

        if(calendar == undefined) {
            await sendDM("Authorization Needed", OWNER);

            return json("Google calendar integration down.");
        }

        await deleteEvent(client, id, calendar);

        await ref.delete();
    }

    return json("Meetings Deleted");
});