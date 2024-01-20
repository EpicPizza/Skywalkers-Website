import { getRoles } from '$lib/Roles/role.server';
import { getRoles as getDiscordRoles } from '$lib/Discord/discord.server'
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { RoleForm } from '$lib/Roles/role';

export async function load({ locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");
    if(locals.team == undefined || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const roles = await getRoles(locals.team);

    const form = await superValidate(RoleForm);

    form.data.color = "#000000";

    return { 
        roles: roles,
        forms: {
            create: form,
        },
        discord: {
            roles: getDiscordRoles(locals.team),
        }
    };
}

