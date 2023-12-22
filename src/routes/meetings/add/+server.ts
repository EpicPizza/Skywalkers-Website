import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getToday, createMeeting } from "$lib/Meetings/helpers.server";
import { duplicateSchema } from "$lib/Meetings/meetings.server";
import { error, redirect, json } from "@sveltejs/kit";
import type { z } from "zod";

export const PATCH = async ({ locals, request }) => {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

    let today = getToday();

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

        const data = doc.data();

        if(data == undefined) return json("Meeting data could not be fetched.");

        try {
            await createMeeting({
                name: data.name,
                location: data.location,
                starts: meetings[i].starts,
                ends: meetings[i].ends,
                virtual: data.virtual,
                lead: data.lead,
                synopsis: data.synopsis,
                thumbnail: data.thumbnail,
                mentor: data.mentor,
                role: data.role,
                completed: false,
                signups: [],
            }, locals.user.uid, locals.firestoreUser.team);
        } catch(e: any) {
            if('type' in e && e.type == "display") {
                return json(e.message);
            } else {
                console.log(e);
            }
        }
    }

    return json("Meetings Duplicated!");
}