import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getQuarantinedMember, unquarantineMember, type QuarantinedMember } from "$lib/Members/manage.server";
import { QuarantineMember, UnquarantineMember } from "$lib/Members/members.js";
import { getRoles } from "$lib/Roles/role.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ locals, params, url }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

    if(!locals.firestoreUser.permissions.includes('KICK_MEMBERS')) {
        throw error(403, "Unauthorized");
    }

    let user: QuarantinedMember;

    try {
        user = await getQuarantinedMember(params.slug);
    } catch {
        throw error(404, "Member Not Found");
    }

    const form = await superValidate(UnquarantineMember);

    form.data.id = user.id,
    form.data.name = user.data.displayName;
    form.data.role = user.data.role as 'mentor' | 'parent' | 'student';
    form.data.pronouns = user.data.pronouns;
    form.data.roles = user.data.roles;

    const roles = await getRoles(locals.firestoreUser.team);

    return {
        user: user,
        form: form,
        roles: roles,
        params: {
            redirectToMain: url.searchParams.get('redirect') === 'main',
        }
    }
}

export let actions = {
    default: async function ({ request, locals, params, url }) {
        if(locals.user == undefined) throw error(401, "Sign In Required");
        if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

        const form = await superValidate(request, UnquarantineMember);

        if(!form.valid) {
            return fail(400, { form });
        }

        if(!locals.firestoreUser.permissions.includes('KICK_MEMBERS')) {
            return message(form, "Insufficient Permissions");
        }

        if(!locals.firestoreUser.permissions.includes('MANAGE_ROLES') && form.data.roles.length != 0) {
            return message(form, "Insufficient Permissions");
        }

        let user: QuarantinedMember;

        try {
            user = await getQuarantinedMember(params.slug);
        } catch {
            return message(form, "Kicked Member Not Found");
        }

        console.log(form.data);

        let newData = {
            displayName: form.data.name,
            photoURL: user.data.photoURL,
            pronouns: form.data.pronouns,
            role: form.data.role,
            roles: form.data.roles,
        } as { displayName: string; photoURL: string; pronouns: string; role: string; roles: string[]; };

        try {
            await unquarantineMember(params.slug, locals.firestoreUser.roles, newData);

            await firebaseAdmin.addLog("Unkicked member.", "workspaces", locals.user.uid);
        } catch(e: any) {
            if(e.message == 'Insufficient Permission Level') {
                return message(form, "Insufficient Permission Level");
            } else {
                return message(form, "An unexpected error occurred.");
            }
        }

        if(url.searchParams.get('redirect') === 'main') {
            throw redirect(307, "/settings/members");
        } else {
            throw redirect(307, "/settings/members/" + params.slug);
        }
    }
}