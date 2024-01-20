import { type Meeting, getMeeting, createFormFromMeeting, validateFormMeeting, editMeetingFromForm } from "$lib/Meetings/helpers.server";
import { meetingSchema } from "$lib/Meetings/meetings.server";
import { getRoles } from "$lib/Roles/role.server";
import { error, redirect, fail } from "@sveltejs/kit";
import { superValidate, message } from "sveltekit-superforms/server";


export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == undefined || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.permissions.includes('EDIT_MEETINGS')) throw error(403, "Unauthorized.");

    let meeting: Meeting | false = false;
    
    try {
        meeting = await getMeeting(params.slug, locals.user.uid, locals.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');
    
    const form = createFormFromMeeting(meeting);

    const roles = await getRoles(locals.team);

    return { form: form, roles: roles };
}

export const actions = {
    default: async ({ request, locals, params, url }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(locals.team == undefined || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        if(!locals.permissions.includes('CREATE_MEETINGS')) throw error(403, "Unauthorized.");

        const form = await superValidate(request, meetingSchema);

        if(!form.valid) {
            return fail(400, { form });
        }
 
        const validated = await validateFormMeeting(form, locals.user.uid, locals.team);

        if(validated === 0) {
            try {
                await editMeetingFromForm(await getMeeting(params.slug, locals.user.uid, locals.team), form, locals.user.uid, locals.team);
            } catch(e: any) {
                if('type' in e && e.type == "display") {
                    return message(form, e.message);
                } else {
                    console.log(e);
                }
            }

            if(url.searchParams.get('redirect') == 'completed') {
                return message(form, "Meeting Edited");
            } else {
                throw redirect(307, "/t/" + locals.team + "/meetings/" + params.slug + "?edited=true");
            }
        } else {
            return validated;
        }
    }
}