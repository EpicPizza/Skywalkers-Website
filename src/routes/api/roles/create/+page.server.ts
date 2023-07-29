import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { RoleForm } from "../../../../lib/Roles/role.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { FieldValue } from "firebase-admin/firestore";

export const actions = {
    default: async ({ request, locals }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        console.log(locals.firestoreUser);

        if(!locals.firestoreUser.permissions.includes('MANAGE_ROLES') || locals.firestoreUser.level == 0) throw error(403);

        const form = await superValidate(request, RoleForm);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const team = locals.firestoreUser.team;

        const id = crypto.randomUUID();

        if((await db.collection('teams').doc(team).collection('roles').get()).docs.length > 250) {
            return message(form, "Role quantity limit met.")
        }

        try {
            await db.runTransaction(async (transaction) => {
                const collection = db.collection('teams').doc(team).collection('roles');
                const usersCollection = db.collection('users').where('team', '==', team);

                const roles = (await transaction.get(collection));
                const users =(await transaction.get(usersCollection));
    
                roles.docs.forEach(async (snapshot) => {
                    if(snapshot.data().name != "everyone") {
                        transaction.update(snapshot.ref, {
                            level: FieldValue.increment(1),
                        })
                    }
                });

                users.docs.forEach(async (snapshot) => {
                    console.log(snapshot.data().level);
                    transaction.update(snapshot.ref, {
                        level: snapshot.data().level == 0 ? 0 : FieldValue.increment(1),
                    })
                });
    
                transaction.create(collection.doc(id), {
                    name: form.data.name,
                    color: form.data.color,
                    permissions: [],
                    level: 1,
                    members: [],
                })
            })
        } catch(e) {
            console.log(e);
            return message(form, "An unexpected error occurred.");
        }

        return message(form, "Role Added at " + id);
    }
}