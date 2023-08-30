import { OWNER } from "$env/static/private";
import { sendDM } from "$lib/Discord/discord.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { createEvent } from "$lib/Google/calendar";
import { getCalendar, getClient, getClientWithCrendentials } from "$lib/Google/client";
import { duplicateSchema } from "$lib/Meetings/meetings.server.js";
import { error, json, redirect } from "@sveltejs/kit";
import { message } from "sveltekit-superforms/server";
import type { z } from "zod";

export const PATCH = async ({ locals, request }) => {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

    let today = new Date();
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);

    let meetings: z.infer<typeof duplicateSchema>["meetings"];

    try {
        let req = await request.json();
        const json = duplicateSchema.parse(req);
        meetings = json.meetings;
    } catch(e) {
        console.log(e);
        return json("Validation Error");
    }

    const db = firebaseAdmin.getFirestore();

    const colRef = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings');

    for(let i = 0; i < meetings.length; i++) {
        const ref = colRef.doc(meetings[i].id);

        const doc = await ref.get();

        if(!doc.exists) {
            return json("Meeting not found.");
        }

        if(meetings[i].starts.valueOf() < today.valueOf()) return json("Past meetings cannot be made.");

        meetings[i].ends.setFullYear(meetings[i].starts.getFullYear());
        meetings[i].ends.setMonth(meetings[i].starts.getMonth());
        meetings[i].ends.setDate(meetings[i].starts.getDate());

        if(meetings[i].ends.valueOf() <= meetings[i].starts.valueOf()) return json("Start time must be before end time.");

        const id = crypto.randomUUID();

        const eventOptions = {
            summary: doc.data()?.name,
            location: doc.data()?.location,
            description: "Find more details here: https://skywalkers.alexest.net/meetings/" + id + ".",
            start: {
                dateTime: meetings[i].starts as Date,
                timeZone: "America/Los_Angeles"
            },
            end: {
                dateTime: meetings[i].ends as Date,
                timeZone: "America/Los_Angeles"
            },
            conferenceData: undefined as unknown,
        }

        if(doc.data()?.link) {
            eventOptions.conferenceData = {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            }
        }

        const client = await getClientWithCrendentials();

        if(client == undefined) {
            await sendDM("Authorization Needed", OWNER);

            return json("Google calendar integration down.");
        }

        const calendar = await getCalendar();

        if(calendar == undefined) {
            await sendDM("Authorization Needed", OWNER);

            return json("Google calendar integration down.");
        }
    
        const event = await createEvent(client, calendar, eventOptions);

        console.log(doc.data());

        const user = locals.user.uid;

        await db.runTransaction(async t => {
            t.create(colRef.doc(id), {
                ...doc.data(),
                when_start: meetings[i].starts,
                when_end: meetings[i].ends,
                completed: false,
                signups: [],
                calendar: event.id,
                link: event.link ?? null,
            });

            firebaseAdmin.addLogWithTransaction("Meeting created.", "event", user, t);
        })
    }

    return json("Meetings Duplicated!");
}