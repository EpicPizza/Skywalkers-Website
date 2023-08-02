import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, getUser, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { completeSchema, getUserList } from '$lib/Meetings/meetings.server.js';
import { getMember } from '$lib/Members/manage.server';
import type { Role } from '$lib/Roles/role';
import { getRole, getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { z } from 'zod';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('EDIT_SYNOPSES')) throw error(403, "Unauthorized.");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('synopsis').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Synopsis Not Found");

    let form = await superValidate(completeSchema);

    let hours = new Array<{ id: string, time: number }>();

    for(let i = 0; i < data.hours.length; i++) {
        hours.push({
            id: data.hours[i].member.id as string,
            time: data.hours[i].time as number,
        })
    }

    form.data.id = params.slug;
    form.data.synopsis = data.synopsis;
    form.data.hours = hours;
    

    const meetingRef = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const meeting = (await meetingRef.get()).data();

    if(meeting == undefined) throw error(404, "Meeting Not Found");

    const length = (meeting.when_end.valueOf() - meeting.when_start.valueOf()) / 1000 / 60 / 60;
    
    return { 
        form: form,
        length: length,
    }
}

export const actions = {
    default: async function({ request, locals }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");

        if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        if(!locals.firestoreUser.permissions.includes('EDIT_SYNOPSES')) throw error(403, "Unauthorized.");

        const form = await superValidate(request, completeSchema);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        let users = await getUserList(db, locals.firestoreUser.team);

        for(let i = 0; i < form.data.hours.length; i++) {
            if(!users.includes(form.data.hours[i].id)) {
                return message(form, "User not found.");
            }
        }

        const team = db.collection('teams').doc(locals.firestoreUser.team);

        const synopsisRef = team.collection('synopsis').doc(form.data.id);

        await db.runTransaction(async t => {
            const synopsis = {
                synopsis: form.data.synopsis,
                hours: [] as { member: DocumentReference, time: number }[],
            }

            for(let i = 0; i < form.data.hours.length; i++) {
                synopsis.hours.push({
                    member: db.collection('users').doc(form.data.hours[i].id),
                    time: form.data.hours[i].time
                })
            }

            t.update(synopsisRef, synopsis);
        })

        throw redirect(307, "/synopsis/" + form.data.id + "")
    }
}