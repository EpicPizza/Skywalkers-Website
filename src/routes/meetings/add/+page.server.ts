import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getUserList, meetingSchema } from "$lib/meetings.server";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const form = await superValidate(meetingSchema);

    return { form: form };
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
        
        const users= await getUserList(db);

        if(!users.includes(form.data.lead) || !users.includes(form.data.mentor) || !users.includes(form.data.synopsis)) {
            return message(form, 'User(s) not found.', {
                status: 404
            });
        }

        const res = await ref.add({
            name: form.data.name,
            lead: db.collection('users').doc(form.data.lead),
            synopsis: db.collection('users').doc(form.data.synopsis),
            mentor: db.collection('users').doc(form.data.mentor),
            location: form.data.location,
            when_start: form.data.starts,
            when_end: form.data.ends,
            thumbnail: form.data.thumbnail,
            completed: false,
        })

        throw redirect(307, "/meetings/" + res.id + "?created=true");
    }
}