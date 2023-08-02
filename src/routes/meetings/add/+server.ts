import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { duplicateSchema } from "$lib/Meetings/meetings.server.js";
import { error, json, redirect } from "@sveltejs/kit";
import type { z } from "zod";

export const PATCH = async ({ locals, request }) => {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

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

        await colRef.add({
            ...doc.data(),
            when_start: meetings[i].starts,
            when_ends: meetings[i].ends,
            completed: false,
            signups: [],
        })
    }

    return json("Meetings Duplicated!");
}