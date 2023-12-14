import { OWNER } from "$env/static/private";
import { sendDM } from "$lib/Discord/discord.server";
import type { FirestoreUser, VerifiedUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { createEvent } from "$lib/Google/calendar";
import { getClientWithCrendentials, getCalendar } from "$lib/Google/client";
import { getMember } from "$lib/Members/manage.server.js";
import { getRoleWithMembers } from "$lib/Roles/role.server";
import { error, fail, json, redirect } from "@sveltejs/kit";
import { superForm } from "sveltekit-superforms/client";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";


export async function POST({ request, locals, params }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");
    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const database = firebaseAdmin.getFirestore();

    const ref = database.collection('teams').doc(locals.firestoreUser.team).collection('schedule').doc(params.id);

    const doc = await ref.get();

    if(!doc.data()) throw error(406, "Scheduler not found.");

    const schedule = {
        title: doc.data()?.title as string,
        description: doc.data()?.description as string,
        first: doc.data()?.first.toDate() as Date,
        days: doc.data()?.days as number,
        times: doc.data()?.times as number,
        length: doc.data()?.length as number,
        count: doc.data()?.count as number,
        member: doc.data()?.member as number,
        location: doc.data()?.location as string | null,
        group: doc.data()?.group as string | null,
        require: doc.data()?.require as string | null,
        signups: doc.data()?.signups as { [key: string]: { availability: { day: number, time: number }[] }},
        confirm: (doc.data()?.confirm ?? []) as null | { members: string[], slots: { day: number, time: number}[] }[],
    };

    const role = await getRoleWithMembers(schedule.group ?? "000000", locals.firestoreUser.team);

    if(role == false && schedule.group) throw error(406, "Role not found.");

    if(schedule.confirm == null) throw error(406, "Confirm not found");

    for(let i = 0; i < schedule.confirm.length; i++) {
        let start = new Date(schedule.first.valueOf() + (schedule.confirm[i].slots[0].day * 1000 * 60 * 60 * 24) + (1000 * 60 * 60) * schedule.confirm[i].slots[0].time);
        let end = new Date(schedule.first.valueOf() + (schedule.confirm[i].slots[0].day * 1000 * 60 * 60 * 24) + (1000 * 60 * 60) * (schedule.confirm[i].slots[schedule.confirm[i].slots.length - 1].time + 1));

        const id = crypto.randomUUID();

        const eventOptions = {
            summary: schedule.title,
            location: "Garage",
            description: "Find more details here: https://skywalkers.alexest.net/meetings/" + id + ".",
            start: {
                dateTime: start,
                timeZone: "America/Los_Angeles"
            },
            end: {
                dateTime: end,
                timeZone: "America/Los_Angeles"
            },
            recurrence: undefined as unknown,
            conferenceData: undefined as unknown,
        }

        const client = await getClientWithCrendentials();

        if(client == undefined) {
            await sendDM("Authorization Needed", OWNER);

            throw error(406, "Google calendar integration down.");
        }

        const calendar = await getCalendar();

        if(calendar == undefined) {
            await sendDM("Authorization Needed", OWNER);

            throw error(406, "Google calendar integration down.");
        }

        const event = await createEvent(client, calendar, eventOptions);

        const user = locals.user.uid;
        const team = locals.firestoreUser.team;

        await database.runTransaction(async t => {
            if(!schedule.confirm) return;

            t.create(database.collection('teams').doc(team).collection('meetings').doc(id), {
                name: schedule.title,
                lead: database.collection('users').doc(schedule.confirm[i].members[0]),
                synopsis: null,
                mentor: null,
                location: schedule.location,
                when_start: start,
                when_end: end,
                thumbnail: "icon:view_list",
                completed: false,
                role: schedule.group ?? null,
                signups: schedule.confirm[i].members,
                calendar: event.id,
                schedule: params.id,
                link: event.link ?? null,
                update: true,
            });

            firebaseAdmin.addLogWithTransaction("Meeting created.", "event", user, t);
        })
    } 

    await ref.update({
        status: true,
    });

    return json("success");
}