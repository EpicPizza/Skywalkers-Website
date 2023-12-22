import { type Meeting, getMeeting, createFormFromMeeting, validateFormMeeting, createMeetingFromForm } from "$lib/Meetings/helpers.server";
import { meetingSchema } from "$lib/Meetings/meetings.server";
import { getRoles } from "$lib/Roles/role.server";
import { error, redirect, fail } from "@sveltejs/kit";
import { superValidate, message } from "sveltekit-superforms/server";


export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

    let meeting: Meeting | false = false;
    
    try {
        meeting = await getMeeting(params.slug, locals.user.uid, locals.firestoreUser.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

    const form = createFormFromMeeting(meeting);

    const roles = await getRoles(locals.firestoreUser.team);

    return { form: form, roles: roles };
}

export const actions = {
    default: async ({ request, locals }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        if(!locals.firestoreUser.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

        const form = await superValidate(request, meetingSchema);
        
        console.log(form.data);

        if(!form.valid) {
            return fail(400, { form });
        }

        const validated = await validateFormMeeting(form, locals.user.uid, locals.firestoreUser.team);

        if(validated === 0) {
            let id;

            try {
                id = await createMeetingFromForm(form, locals.user.uid, locals.firestoreUser.team);
            } catch(e: any) {
                if('type' in e && e.type == "display") {
                    return message(form, e.message);
                } else {
                    console.log(e);
                }
            }

            throw redirect(307, "/meetings/" + id + "?created=true");
        } else {
            return validated;
        }
    }
}