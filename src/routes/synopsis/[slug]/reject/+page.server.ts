import { DOMAIN } from '$env/static/private';
import type { SecondaryUser } from '$lib/Firebase/firebase';
import { firebaseAdmin, seralizeFirestoreUser } from '$lib/Firebase/firebase.server';
import type { Hours } from '$lib/Hours/hours.server';
import type { Role } from '$lib/Roles/role';
import { getRole } from '$lib/Roles/role.server';
import { error, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';

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

        const team = locals.firestoreUser.team;
        const uid = locals.user.uid;

        await db.runTransaction(async t => {
            let toUpdate: {ref: DocumentReference, data: { total: number, entries: Hours['entries'] }}[] = new Array();

            console.log(synopsisData.hours)
            for(let i = 0; i < synopsisData.hours.length; i++) {

                const ref = db.collection('teams').doc(team).collection('hours').doc(synopsisData.hours[i].member.id);

                const doc = await t.get(ref);

                if(!doc.exists) throw error(400, "Hours not found.");

                const data = doc.data() as Hours;

                if(!data) throw error(400, "Hours not found.");
                if(!data.deleted) {
                    (() => {
                        for(let j = 0; j < data.entries.length; j++) {
                            if(data.entries[j].id == params.slug) {
                                data.entries.splice(j, 1);
                                return;
                            }
                        }
                    })();

                    toUpdate.push({ref, data: {
                        total: data.total - synopsisData.hours[i].time,
                        entries: data.entries,
                    }});
                }
            }

            for(let i = 0; i < toUpdate.length; i++) {
                t.update(toUpdate[i].ref, toUpdate[i].data);
            }

            t.update(meetingRef, {
                completed: false,
            });

            t.delete(synopsisRef);

            firebaseAdmin.addLogWithTransaction("Synopsis rejected.", "summarize", uid, t);
        })

        const folderPath = `synopses/${params.slug}`;

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
        })

        throw redirect(303, "/meetings/completed/1");
    }
}