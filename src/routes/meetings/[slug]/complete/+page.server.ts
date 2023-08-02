import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, getUser, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { completeSchema, getUserList } from '$lib/Meetings/meetings.server.js';
import type { Role } from '$lib/Roles/role';
import { getRole, getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { z } from 'zod';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    let signups = new Array<SecondaryUser>();

    for(let i = 0; i < data.signups.length; i++) {
        const user = (await data.signups[i].get()).data();

        if(user != undefined) {
            signups.push({
                ...user,
                roles: await getSpecifiedRoles(user.roles),
                id: data.signups[i].id,
            } as SecondaryUser);
        }
    }

    let synopsis; 
    if(data.synopsis != null) {
        synopsis = await seralizeFirestoreUser((await data.synopsis.get()).data())
    }

    let mentor;
    if(data.mentor != null) {
        mentor = await seralizeFirestoreUser((await data.mentor.get()).data())
    }

    let role;
    if(data.role != null) {
        role = await getRole(data.role, locals.firestoreUser.team);
    }

    const meeting = {
        name: data.name as string,
        lead: await seralizeFirestoreUser((await data.lead.get()).data()),
        //@ts-ignore
        synopsis: data.synopsis == null ? undefined : synopsis == undefined ? "User Not Found" : synopsis,
        //@ts-ignore
        mentor: data.mentor == null ? undefined : mentor == undefined ? "User Not Found" :  mentor,
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        id: params.slug as string,
        role: role as Role | undefined,
        length: 0,
        signups: signups
    }

    const length = (meeting.when_end.valueOf() - meeting.when_start.valueOf()) / 1000 / 60 / 60;

    meeting.length = length;

    if((meeting.lead != undefined && meeting.lead.team != locals.firestoreUser.team) || (typeof meeting.synopsis == 'object' && meeting.synopsis.team != locals.firestoreUser.team) || (typeof meeting.mentor == 'object' && meeting.mentor.team != locals.firestoreUser.team)) throw error(500, "Meeting Requested Inaccessible Resource");

    let form = await superValidate(completeSchema);

    form.data.id = meeting.id;

    let hours = new Array<{ id: string, time: number }>()

    for(let i = 0; i < signups.length; i++) {
        hours.push({
            time: length,
            id: signups[i].id
        })    
    }

    form.data.hours = hours;
    
    return { 
        meeting: meeting,
        form: form,
    }
}

export const actions = {
    default: async function({ request, locals }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");

        if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

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

        const meetingRef = team.collection('meetings').doc(form.data.id);

        const synopsisRef = team.collection('synopsis').doc(form.data.id);

        const meeting = await meetingRef.get();

        if(!meeting.exists) {
            return message(form, "Meeting not found.");
        }

        await db.runTransaction(async t => {
            t.update(meetingRef, {
                completed: true,
            })

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

            t.create(synopsisRef, synopsis);
        })

        throw redirect(307, "/meetings/" + form.data.id + "")
    }
}