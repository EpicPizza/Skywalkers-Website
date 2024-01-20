import { createDefaultMeetingForm, validateFormMeeting, createMeetingFromForm, type Meeting } from "$lib/Meetings/helpers.server";
import { recurringSchema, meetingSchema } from "$lib/Meetings/meetings.server";
import { getRoles } from "$lib/Roles/role.server";
import { error, redirect, fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == null || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

    const form = await createDefaultMeetingForm(locals.user.uid);
    const recurring = await superValidate(recurringSchema);

    const roles = await getRoles(locals.team);

    return { forms: { onetime: form, recurring: recurring }, roles: roles, };
}

export const actions = {
    onetime: async ({ request, locals }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(locals.team == undefined || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        if(!locals.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

        const form = await superValidate(request, meetingSchema);

        if(!form.valid) {
            return fail(400, { form });
        }
 
        const validated = await validateFormMeeting(form, locals.user.uid, locals.team);

        if(validated === 0) {
            let meeting: false | Meeting = false;

            try {
                meeting = await createMeetingFromForm(form, locals.user.uid, locals.team);
            } catch(e: any) {
                if('type' in e && e.type == "display") {
                    return message(form, e.message);
                } else {
                    console.log(e);
                }
            }

            if(meeting == false) return message(form, "An error occurred.");

            throw redirect(307, "/t/" + locals.team + "/meetings/" + meeting.id + "?created=true");
        } else {
            return validated;
        }
    }
}