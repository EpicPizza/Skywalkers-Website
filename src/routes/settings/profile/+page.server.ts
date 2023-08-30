import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

const UpdateProfile = z.object({
    name: z.string({ required_error: "A name is required.", invalid_type_error: "Name must be a string."}).min(1, { message: "Name must be at minimum one character."}).max(32, { message: "Name may not exceed 32 characters." }),
    pronouns: z.string({ required_error: "Pronouns must be included, even if empty.", invalid_type_error: "Pronouns must be a string."}).max(32, { message: "Pronouns may not exceed 32 characters." }),
})

export async function load({locals}) {
    if(locals.user == undefined) throw error(401, "Must be signed in");
    if(locals.firestoreUser == undefined) throw error(403, "Must be verified");

    const form = await superValidate(UpdateProfile);

    form.data.name = locals.firestoreUser.displayName;
    form.data.pronouns = locals.firestoreUser.pronouns;

    return { form: form };
}

export const actions = {
    default: async ({ request, locals }) => {
        if(locals.user == undefined) throw error(401, "Must be signed in");
        if(locals.firestoreUser == undefined) throw error(403, "Must be verified");

        const form = await superValidate(request, UpdateProfile);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();
        const ref = db.collection('users').doc(locals.user.uid);
        const uid = locals.user.uid;

        await db.runTransaction(async t => {
            t.update(ref, {
                displayName: form.data.name,
                pronouns: form.data.pronouns,
            });

            firebaseAdmin.addLogWithTransaction("Edited profile.", "badge", uid, t);
        })

        return message(form, "Changes Saved");
    }
}