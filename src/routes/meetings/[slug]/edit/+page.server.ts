import { PUBLIC_DEFAULT_USER } from '$env/static/public';
import type { FirestoreUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { getUserList, meetingSchema } from '$lib/meetings.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    if(data.completed == true) throw error(404, "Not Editable; Meeting Completed")

    const meeting = {
        name: data.name as string,
        lead: (await data.lead.get()).data() as FirestoreUser,
        synopsis: (await data.synopsis.get()).data() as FirestoreUser,
        mentor: (await data.mentor.get()).data() as FirestoreUser,
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        id: params.slug as string,
    }

    if(meeting.lead.team != locals.firestoreUser.team || meeting.synopsis.team != locals.firestoreUser.team || meeting.mentor.team != locals.firestoreUser.team) throw error(500, "Meeting Requested Inaccessible Resource");

    const form = await superValidate(meetingSchema);

    form.data.lead = (data.mentor as DocumentReference).id;
    form.data.synopsis = (data.synopsis as DocumentReference).id;
    form.data.mentor = (data.mentor as DocumentReference).id;
    form.data.name = meeting.name;
    form.data.location = meeting.location;
    form.data.starts = meeting.when_start;
    form.data.ends = meeting.when_end;
    form.data.thumbnail = meeting.thumbnail;

    return { meeting: meeting, form: form };
}

export const actions = {
    default: async ({ request, locals, params }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        const form = await superValidate(request, meetingSchema);

        console.log(form.data);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);
        
        const users= await getUserList(db);

        if(!users.includes(form.data.lead) || !users.includes(form.data.mentor) || !users.includes(form.data.synopsis)) {
            return message(form, 'User(s) not found.', {
                status: 404
            });
        }

        await ref.update({
            name: form.data.name,
            lead: db.collection('users').doc(form.data.lead),
            synopsis: db.collection('users').doc(form.data.synopsis),
            mentor: db.collection('users').doc(form.data.mentor),
            location: form.data.location,
            when_start: form.data.starts,
            when_end: form.data.ends,
            thumbnail: form.data.thumbnail,
        })

        throw redirect(307, "/meetings/" + params.slug + "?edited=true");
    }
}