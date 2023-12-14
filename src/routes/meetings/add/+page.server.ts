import { OWNER } from "$env/static/private";
import { sendDM } from "$lib/Discord/discord.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { createEvent } from "$lib/Google/calendar.js";
import { getCalendar, getClient, getClientWithCrendentials } from "$lib/Google/client.js";
import { getUserList, meetingSchema, recurringSchema } from "$lib/Meetings/meetings.server";
import { getRole, getRoleWithMembers, getRoles } from "$lib/Roles/role.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

    const form = await superValidate(meetingSchema);
    const recurring = await superValidate(recurringSchema);

    //some sensible defaults

    form.data.lead = locals.user.uid;

    form.data.starts = new Date();
    form.data.starts.setHours(17);
    form.data.starts.setMinutes(0);
    form.data.starts.setMilliseconds(0);

    recurring.data.starts = new Date();
    recurring.data.starts.setHours(17);
    recurring.data.starts.setMinutes(0);
    recurring.data.starts.setMilliseconds(0);

    form.data.ends = new Date();
    form.data.ends.setHours(20);
    form.data.ends.setMinutes(0);
    form.data.ends.setMilliseconds(0);

    recurring.data.ends = new Date();
    recurring.data.ends.setHours(20);
    recurring.data.ends.setMinutes(0);
    recurring.data.ends.setMilliseconds(0);

    form.data.thumbnail = "icon:event";

    recurring.data.thumbnail = "icon:event";

    const roles = await getRoles(locals.firestoreUser.team);

    return { forms: { onetime: form, recurring: recurring }, roles: roles, };
}

export const actions = {
    onetime: async ({ request, locals }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

        const form = await superValidate(request, meetingSchema);
        
        console.log(form.data);

        if(!form.valid) {
            return fail(400, { form });
        }

        let today = new Date();
        today.setMilliseconds(0);
        today.setSeconds(0);
        today.setMinutes(0);
        today.setHours(0);

        if(form.data.starts.valueOf() < today.valueOf()) return message(form, "Past meetings cannot be made.");
        if(form.data.ends.valueOf() <= form.data.starts.valueOf()) return message(form, "Start time must be before end time.");

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings');
        
        const users= await getUserList(db, locals.firestoreUser.team);

        if(!users.includes(form.data.lead) || (form.data.mentor != undefined && form.data.mentor != '' && !users.includes(form.data.mentor)) || (form.data.synopsis != undefined && form.data.synopsis != '' && !users.includes(form.data.synopsis))) {
            return message(form, 'User(s) not found.', {
                status: 404
            });
        }

        if(!(form.data.role == undefined || form.data.role == '') && !(await db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(form.data.role).get()).exists) return message(form, "Role not found.");

        const role = await getRoleWithMembers(form.data.role ?? "000000", locals.firestoreUser.team);

        if(role == false && form.data.role) return message(form, "Role not found.");

        const id = crypto.randomUUID();

        const eventOptions = {
            summary: form.data.name,
            location: form.data.location,
            description: "Find more details here: https://skywalkers.alexest.net/meetings/" + id + ".",
            start: {
                dateTime: form.data.starts,
                timeZone: "America/Los_Angeles"
            },
            end: {
                dateTime: form.data.ends,
                timeZone: "America/Los_Angeles"
            },
            recurrence: undefined as unknown,
            conferenceData: undefined as unknown,
        }

        if(form.data.virtual) {
            eventOptions.conferenceData = {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            }
        }

        console.log(form.data.virtual);

        const client = await getClientWithCrendentials();

        if(client == undefined) {
            await sendDM("Authorization Needed", OWNER);

            return message(form, "Google calendar integration down.");
        }

        const calendar = await getCalendar();

        if(calendar == undefined) {
            await sendDM("Authorization Needed", OWNER);

            return message(form, "Google calendar integration down.");
        }
    
        const event = await createEvent(client, calendar, eventOptions);

        const user = locals.user.uid;
        const team = locals.firestoreUser.team;

        await db.runTransaction(async t => {
            t.create(ref.doc(id), {
                name: form.data.name,
                lead: db.collection('users').doc(form.data.lead),
                synopsis: form.data.synopsis == undefined || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
                mentor: form.data.mentor == undefined || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
                location: form.data.location,
                when_start: form.data.starts,
                when_end: form.data.ends,
                thumbnail: form.data.thumbnail,
                completed: false,
                role: form.data.role ?? null,
                signups: [],
                calendar: event.id,
                link: event.link ?? null,
            });

            firebaseAdmin.addLogWithTransaction("Meeting created.", "event", user, t);
        })

        throw redirect(307, "/meetings/" + id + "?created=true");
    }
}