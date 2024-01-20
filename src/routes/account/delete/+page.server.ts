import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, redirect } from "@sveltejs/kit";
import { unlink } from '$lib/Discord/link.server';
import { kickMember } from "$lib/Members/manage.server.js";

export const actions = {
    default: async function({ locals }) {
        if(locals.user == undefined) throw error(401, "Not Signed In");

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(locals.user.uid);

        const doc = await ref.get();

        if((!doc.exists || doc.data() == undefined)) {
            try {
                await firebaseAdmin.getAuth().deleteUser(locals.user.uid);
            } catch(e) {
                console.log(e);

                return error(401, "An unexpected error occurred, please contact us for further help.");
            }

            return { success: true };
        } else if(!(!doc.exists || doc.data() == undefined)) {
            try {
                if(locals.firestoreUser) {
                    for(let i = 0; i < locals.firestoreUser.teams.length; i++) {
                        kickMember(locals.user.uid, locals.firestoreUser.teams[i].team);
                    }
                }
            } catch(e) {
                console.log(e);

                return error(401, "An unexpected error occurred, please contact us for further help.");
            }
        }

        try {
            await firebaseAdmin.getAuth().deleteUser(locals.user.uid);
        } catch(e) {
            console.log(e);

            throw error(501, "An unexpected error occurred, please contact us for further help.");
        }

        return { success: true };
    }       
}