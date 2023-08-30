import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { RoleForm } from "$lib/Roles/role";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");
    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const form = await superValidate(RoleForm);

    return {
        role: params.slug,
        forms: {
            edit: form
        }
    }
}

export const actions = {
    default: async ({ request, locals, params }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        const form = await superValidate(request, RoleForm);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const team = locals.firestoreUser.team;
        const user = locals.user.uid;

        const ref = db.collection('teams').doc(team).collection('roles').doc(params.slug);

        let roleCheck = await ref.get();

        if(!roleCheck.exists) throw error(400);

        if(roleCheck.data()?.name == 'everyone') throw error(400);

        if(roleCheck.data()?.level as number >= locals.firestoreUser.level) throw(403);

        try {
            await db.runTransaction(async (transaction) => {    
                transaction.update(ref, {
                    name: form.data.name,
                    color: form.data.color,
                })

                firebaseAdmin.addLogWithTransaction("Edited a role.", "group", user, transaction);
            })
        } catch(e) {
            console.log(e);
            return message(form, "An unexpected error occurred.");
        }

        return message(form, "Role Edited");
    }
}