import type { SecondaryUser } from '$lib/Firebase/firebase';
import { firebaseAdmin, seralizeFirestoreUser } from '$lib/Firebase/firebase.server';
import type { Role } from '$lib/Roles/role';
import { getRole } from '$lib/Roles/role.server';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('MODERATE_SYNOPSES')) throw error(403, "Unauthorized.");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    if(!locals.firestoreUser.permissions.includes('ADD_SYNOPSES') && data.synopsis.id != locals.user.uid && data.lead.id != locals.user.uid) throw error(403, "Unauthorized.");

    const meeting = {
        name: data.name as string,
    }

    return {
        meeting,
    }
}

export const actions = {
    default: async function ({ locals, params }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");

        if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        if(!locals.firestoreUser.permissions.includes('MODERATE_SYNOPSES')) throw error(403, "Unauthorized.");

        if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

        const db = firebaseAdmin.getFirestore();

        const meetingRef = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);
    
        const meetingData = (await meetingRef.get()).data();
    
        if(meetingData == undefined) throw error(404, "Meeting Not Found");

        const synopsisRef = db.collection('teams').doc(locals.firestoreUser.team).collection('synopsis').doc(params.slug);
    
        const synopsisData = (await synopsisRef.get()).data();
    
        if(synopsisData == undefined) throw error(404, "Synopsis Not Found");

        await db.runTransaction(async t => {
            t.update(meetingRef, {
                completed: false,
            });

            t.delete(synopsisRef);
        })

        throw redirect(307, "/completed/1");
    }
}