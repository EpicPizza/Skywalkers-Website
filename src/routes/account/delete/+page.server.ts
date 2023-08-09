import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { quarantineMember } from "$lib/Members/manage.server";
import { error, redirect } from "@sveltejs/kit";

export const actions = {
    default: async function({ locals }) {
        if(locals.user == undefined) throw error(401, "Not Signed In");

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(locals.user.uid);

        const doc = await ref.get();

        const kickedRef = db.collection('quarantine').doc(locals.user.uid);

        let kickedDoc = await kickedRef.get();

        if((!doc.exists || doc.data() == undefined) && (!kickedDoc || kickedDoc.data() == undefined)) {
            try {
                await firebaseAdmin.getAuth().deleteUser(locals.user.uid);
            } catch(e) {
                console.log(e);

                return error(401, "An unexpected error occurred, please contact us for further help.");
            }

            return { success: true };
        } else if(!(!doc.exists || doc.data() == undefined)) {
            try {
                await quarantineMember(locals.user.uid);
            } catch(e) {
                console.log(e);

                return error(401, "An unexpected error occurred, please contact us for further help.");
            }
        }

        kickedDoc = await kickedRef.get();

        if(!(!kickedDoc || kickedDoc.data() == undefined)) {
            await kickedRef.delete();
        } else {
            console.log("Kicked doc not found.");

            throw error(501, "An unexpected error occurred, please contact us for further help.");
        }

        if(locals.firestoreUser && locals.firestoreUser.team) {
            const hoursRef = db.collection('teams').doc(locals.firestoreUser.team).collection('hours').doc(locals.user.uid);

            const hours = await hoursRef.get();

            if(hours.exists) await hoursRef.delete();
        }

        try {
            await firebaseAdmin.getAuth().deleteUser(locals.user.uid);
        } catch(e) {
            console.log(e);

            throw error(501, "An unexpected error occurred, please contact us for further help.");
        }

        const folderPath = `users/${locals.user.uid}`;

        await new Promise((resolve) => {
            firebaseAdmin.getBucket().deleteFiles({
                prefix: folderPath,
            }, (err, files) => {
                if(err) {
                    console.log(err);

                    throw error(501, "An unexpected error occurred, please contact us for further help.");
                }

                resolve(null);
            })
        });

        return { success: true };
    }       
}