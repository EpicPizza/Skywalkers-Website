import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getUserList, meetingSchema } from "$lib/Meetings/meetings.server";
import { getRoles } from "$lib/Roles/role.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const form = await superValidate(meetingSchema);

    //some sensible defaults

    form.data.lead = locals.user.uid;

    form.data.starts = new Date();
    form.data.starts.setHours(17);
    form.data.starts.setMinutes(0);
    form.data.starts.setMilliseconds(0);

    form.data.ends = new Date();
    form.data.ends.setHours(20);
    form.data.ends.setMinutes(0);
    form.data.ends.setMilliseconds(0);

    form.data.thumbnail = "icon:event";

    const roles = await getRoles(locals.firestoreUser.team);

    return { form: form, roles: roles, };
}

export const actions = {
    default: async ({ request, locals }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        const form = await superValidate(request, meetingSchema);
        
        console.log(form.data);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings');
        
        const users= await getUserList(db, locals.firestoreUser.team);

        if(!users.includes(form.data.lead) || (form.data.mentor != undefined && form.data.mentor != '' && !users.includes(form.data.mentor)) || (form.data.synopsis != undefined && form.data.synopsis != '' && !users.includes(form.data.synopsis))) {
            return message(form, 'User(s) not found.', {
                status: 404
            });
        }

        if(form.data.role != undefined && !(await db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(form.data.role).get()).exists) return message(form, "Role not found.");

        const res = await ref.add({
            name: form.data.name,
            lead: db.collection('users').doc(form.data.lead),
            synopsis: form.data.synopsis == undefined || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
            mentor: form.data.mentor == undefined || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
            location: form.data.location,
            when_start: form.data.starts,
            when_end: form.data.ends,
            thumbnail: form.data.thumbnail,
            completed: false,
            role: form.data.role == undefined ? null : form.data.role,
            signups: [],
        })

        throw redirect(307, "/meetings/" + res?.id + "?created=true");
    }
}