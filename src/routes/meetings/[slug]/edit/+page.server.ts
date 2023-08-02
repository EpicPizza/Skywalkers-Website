import { PUBLIC_DEFAULT_USER } from '$env/static/public';
import type { FirestoreUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { getUserList, meetingSchema } from '$lib/Meetings/meetings.server.js';
import { getRoles } from '$lib/Roles/role.server';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('EDIT_MEETINGS')) throw error(403, "Unauthorized.");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    if(data.completed == true) throw error(404, "Not Editable; Meeting Completed")

    const meeting = {
        name: data.name as string,
        lead: await seralizeFirestoreUser((await data.lead.get()).data()),
        synopsis:  data.synopsis == null ? undefined : await seralizeFirestoreUser((await data.synopsis.get()).data()),
        mentor: data.mentor == null ? undefined : await seralizeFirestoreUser((await data.mentor.get()).data()),
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        role: data.role as string | undefined,
        id: params.slug as string,
    }

    if((meeting.lead != undefined && meeting.lead.team != locals.firestoreUser.team) || (meeting.synopsis != undefined && meeting.synopsis.team != locals.firestoreUser.team) || (meeting.mentor != undefined && meeting.mentor.team != locals.firestoreUser.team)) throw error(500, "Meeting Requested Inaccessible Resource");

    const form = await superValidate(meetingSchema);

    console.log(data);

    form.data.lead = (data.lead as DocumentReference).id;
    form.data.synopsis = data.synopsis == null ? "" : (data.synopsis as DocumentReference).id;
    form.data.mentor = data.mentor == null ? "" : (data.mentor as DocumentReference).id;
    form.data.name = meeting.name;
    form.data.location = meeting.location;
    form.data.starts = meeting.when_start;
    form.data.ends = meeting.when_end;
    form.data.thumbnail = meeting.thumbnail;
    form.data.role = meeting.role;

    const roles = await getRoles(locals.firestoreUser.team);

    return { meeting: meeting, form: form, roles: roles };
}

export const actions = {
    default: async ({ request, locals, params, url }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        if(!locals.firestoreUser.permissions.includes('EDIT_MEETINGS')) throw error(403, "Unauthorized.");

        const form = await superValidate(request, meetingSchema);

        console.log(form.data);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);
        
        const users= await getUserList(db, locals.firestoreUser.team);

        if(!users.includes(form.data.lead) || (form.data.mentor != undefined && form.data.mentor != '' && !users.includes(form.data.mentor)) || (form.data.synopsis != undefined && form.data.synopsis != '' && !users.includes(form.data.synopsis))) {
            return message(form, 'User(s) not found.', {
                status: 404
            });
        }

        if(form.data.role != undefined && !(await db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(form.data.role).get()).exists) return message(form, "Role not found.");

        await ref.update({
            name: form.data.name,
            lead: db.collection('users').doc(form.data.lead),
            synopsis: form.data.synopsis == undefined || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
            mentor: form.data.mentor == undefined || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
            location: form.data.location,
            when_start: form.data.starts,
            when_end: form.data.ends,
            thumbnail: form.data.thumbnail,
            role: form.data.role == undefined ? null : form.data.role,
        })

        if(url.searchParams.get('redirect') == 'completed') {
            return message(form, "Meeting Edited");
        } else {
            throw redirect(307, "/meetings/" + params.slug + "?edited=true");
        }
    }
}