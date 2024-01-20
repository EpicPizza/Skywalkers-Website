import type { SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { getMember, kickMember } from '$lib/Members/manage.server.js';
import { EditProfile, QuarantineMember } from '$lib/Members/members';
import { getRoles } from '$lib/Roles/role.server';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { z } from 'zod';
import { unlink } from '$lib/Discord/link.server';

export async function load({ request, locals, params, depends }) {
    depends("member-" + params.slug);

    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined || locals.team == undefined) throw redirect(307, "/verify");


    let user: SecondaryUser;

    try {
        user = await getMember(params.slug, locals.team);
    } catch {
        throw error(404, "Member Not Found");
    }

    const kickForm = await superValidate(QuarantineMember);

    const roles = await getRoles(locals.team);
    
    return {  forms: { kick: kickForm }, roles: roles, member: { user: user } as { user: SecondaryUser } }
}

export const actions = {
    kick: async function({ request, locals }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.firestoreUser == undefined || locals.team == undefined) throw error(403);

        const form = await superValidate(request, QuarantineMember);

        if(!form.valid) {
            return message(form, "A validation error occurred.");
        }

        if(!locals.permissions.includes('KICK_MEMBERS')) {
            return message(form, "Insufficient permissions.");
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(form.data.id);

        const member = await getMember(form.data.id, locals.team, true);

        if(member.teams.length == 0) {
            return message(form, "User not found.");
        }

        let level = 0; 

        for(let i = 0; i < member.teams.length; i++) {
            if(member.teams[i].team == locals.team) {
                level = member.teams[i].level;
            }
        }

        if(level >= locals.level) {
            return message(form, "Insufficient permission level.");
        }

        try {
            await unlink(form.data.id);

            await kickMember(form.data.id, locals.team);

            await firebaseAdmin.addLog("Kicked a member.", "workspaces", locals.user.uid);
        } catch(e) {
            return message(form, "An unexpected error occurred.");
        }

        throw redirect(307, "/t/" + locals.team + "/settings/members");
    }
}