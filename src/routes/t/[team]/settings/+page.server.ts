import { unlink } from "$lib/Discord/link.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getMember, kickMember } from "$lib/Members/manage.server";
import { QuarantineMember } from "$lib/Members/members";
import { error, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/client";

export async function load({ locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == undefined || locals.firestoreUser == undefined) throw redirect(307, "/t/" + locals.unverifiedTeam + "/verify?needverify=true");

    const kickForm = await superValidate(QuarantineMember);

    return { kickForm };
}

export const actions = {
    kick: async function({ request, locals }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.firestoreUser == undefined || locals.team == undefined) throw error(403);

        const form = await superValidate(request, QuarantineMember);

        if(!form.valid) {
            return message(form, "A validation error occurred.");
        }

        if(form.data.id != locals.user.uid) {
            return message(form, "You cannot leave for another person.");
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(form.data.id);

        const member = await getMember(form.data.id, locals.team, true);

        if(member.teams.length == 0) {
            return message(form, "User not found.");
        }

        for(let i = 0; i < member.teams.length; i++) {
            if(member.teams[i].team == locals.team) {
                for(let j = 0; j < member.teams[i].roles.length; j++) {
                    if(member.teams[i].roles[j].name == "owner") {
                        return message(form, "You cannot leave a team you own.")
                    }
                }
            }
        }

        try {
            await unlink(form.data.id);

            await kickMember(form.data.id, locals.team);

            await firebaseAdmin.addLog("Kicked a member.", "workspaces", locals.user.uid);
        } catch(e) {
            return message(form, "An unexpected error occurred.");
        }

        throw redirect(307, "/");
    }
}