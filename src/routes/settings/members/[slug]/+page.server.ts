import type { SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { getMember, getQuarantinedMember, quarantineMember, type QuarantinedMember } from '$lib/Members/manage.server.js';
import { EditProfile, QuarantineMember } from '$lib/Members/members';
import { getRoles } from '$lib/Roles/role.server';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { z } from 'zod';
import { unlink } from '$lib/Discord/link.server';

export async function load({ request, locals, params, depends }) {
    depends("member-" + params.slug);

    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");


    let user: SecondaryUser | QuarantinedMember;
    let verified = false;

    try {
        user = await getMember(params.slug);
        verified = true;
    } catch {
        try {
            user = await getQuarantinedMember(params.slug);
            verified = false;

            if(!locals.firestoreUser.permissions.includes('KICK_MEMBERS')) {
                throw error(404, "Member Not Found");
            }
        } catch {
            throw error(404, "Member Not Found");
        }
    }

    const editForm = await superValidate(EditProfile);
    const kickForm = await superValidate(QuarantineMember);

    const roles = await getRoles(locals.firestoreUser.team);

    console.log(user);

    if(verified) {
        return {  forms: { kick: kickForm, edit: editForm }, roles: roles, member: { user: user, kicked: false } as { user: SecondaryUser, kicked: false } }
    } else {
        return {  forms: { kick: kickForm, edit: editForm }, roles: roles, member: { user: user, kicked: true } as { user: QuarantinedMember, kicked: true } }
    }
}

export const actions = {
    edit: async function ({ request, locals }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.firestoreUser == undefined) throw error(403);

        const form = await superValidate(request, EditProfile);

        if(!form.valid) {
            return fail(400, { form });
        }

        if(!locals.firestoreUser.permissions.includes('MODERATE_PROFILES')) {
            return message(form, "Insufficient permissions.");
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(form.data.id);

        const doc = await ref.get();

        if(!doc.exists || doc.data() == undefined) {
            return message(form, "User not found.");
        }

        if(doc.data()?.level >= locals.firestoreUser.level) {
            return message(form, "Insufficient permission level.");
        }

        ref.update({
            displayName: form.data.name,
            pronouns: form.data.pronouns
        });

        await firebaseAdmin.addLog("Edited a member's profile.", "workspaces", locals.user.uid);

        return message(form, "Edited Profile");
    },
    kick: async function({ request, locals }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.firestoreUser == undefined) throw error(403);

        const form = await superValidate(request, QuarantineMember);

        console.log('Valid', form.valid);

        if(!form.valid) {
            return message(form, "A validation error occurred.");
        }

        console.log("Permissions", JSON.stringify(locals.firestoreUser.permissions));

        if(!locals.firestoreUser.permissions.includes('KICK_MEMBERS')) {
            return message(form, "Insufficient permissions.");
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(form.data.id);

        const doc = await ref.get();

        if(!doc.exists || doc.data() == undefined) {
            return message(form, "User not found.");
        }

        if(doc.data()?.level >= locals.firestoreUser.level) {
            return message(form, "Insufficient permission level.");
        }

        try {
            await unlink(form.data.id);

            await quarantineMember(form.data.id);

            await firebaseAdmin.addLog("Kicked a member.", "workspaces", locals.user.uid);
        } catch(e) {
            return message(form, "An unexpected error occurred.");
        }

        return message(form, "Member kicked.");
    }
}