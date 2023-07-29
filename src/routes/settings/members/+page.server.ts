import type { SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getQuarantinedMembers, quarantineMember } from "$lib/Members/manage.server.js";
import { EditProfile, QuarantineMember } from "$lib/Members/members";
import { getSpecifiedRoles } from "$lib/Roles/role.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export async function load({ locals }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').where('team', '==', locals.firestoreUser.team);

    const userDocs = (await ref.get()).docs;

    let users = new Array<SecondaryUser>();

    for(let i = 0; i < userDocs.length; i++) {
        users.push({
            displayName: userDocs[i].data().displayName as string,
            level: userDocs[i].data().level as number,
            permissions: userDocs[i].data().permissions as string[],
            photoURL: userDocs[i].data().photoURL as string,
            pronouns: userDocs[i].data().pronouns as string,
            team: userDocs[i].data().team as string,
            roles: [],
            role: userDocs[i].data().role as string,
            id: userDocs[i].id
        })
    }

    const quarantinedMembers = locals.firestoreUser.permissions.includes('KICK_MEMBERS') ? await getQuarantinedMembers(locals.firestoreUser.team) : [];

    const editForm = await superValidate(EditProfile);
    const kickForm = await superValidate(QuarantineMember);

    return {
        members: users,
        quarantinedMembers: quarantinedMembers,
        forms: {
            editProfile: editForm,
            kickForm: kickForm,
        }
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
        })

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
            await quarantineMember(form.data.id);
        } catch(e) {
            return message(form, "An unexpected error occurred.");
        }

        return message(form, "Member kicked.");
    }
}