import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getUserList, meetingSchema } from "$lib/Meetings/meetings.server";
import { error, fail, redirect } from "@sveltejs/kit";
import type { DocumentReference } from "firebase/firestore";
import { message, superValidate } from "sveltekit-superforms/server";

export async function load({ params, locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const form = await superValidate(meetingSchema);

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    const meeting = {
        name: data.name as string,
        lead: data.lead as DocumentReference,
        synopsis: data.synopsis as DocumentReference | null,
        mentor: data.mentor as DocumentReference | null,
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        id: params.slug as string,
    }

    form.data.starts = meeting.when_start;
    form.data.ends = meeting.when_end;
    form.data.name = meeting.name;
    form.data.location = meeting.location;
    form.data.thumbnail = meeting.thumbnail;
    form.data.lead = meeting.lead.id;
    form.data.mentor = meeting.mentor == null ? "" : meeting.mentor.id;
    form.data.synopsis = meeting.synopsis == null ? "" : meeting.synopsis.id;

    return { form: form };
}

export const actions = {
    default: async ({ request, locals }) => {
        if(locals.user == undefined) { throw error(403, 'Sign In Required'); }

        if(!locals.team || locals.firestoreUser == undefined) throw redirect(307, "/verify");

        const form = await superValidate(request, meetingSchema);
        
        console.log(form.data);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings');
        
        const users= await getUserList(db, locals.firestoreUser.team);

        console.log(form.data);

        if(!users.includes(form.data.lead) || (form.data.mentor != undefined && form.data.mentor != '' && !users.includes(form.data.mentor)) || (form.data.synopsis != undefined && form.data.synopsis != '' && !users.includes(form.data.synopsis))) {
            return message(form, 'User(s) not found.', {
                status: 404
            });
        }

        for(let i = 0; i < 9; i++) {
            await ref.add({
                name: form.data.name,
                lead: db.collection('users').doc(form.data.lead),
                synopsis: form.data.synopsis == undefined || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
                mentor: form.data.mentor == undefined || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
                location: form.data.location,
                when_start: form.data.starts,
                when_end: form.data.ends,
                thumbnail: form.data.thumbnail,
                completed: false,
                signups: [],
            })
        }

        const res = await ref.add({
            name: form.data.name,
            lead: db.collection('users').doc(form.data.lead),
            synopsis: form.data.synopsis == undefined || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
            mentor: form.data.mentor == undefined || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
            location: form.data.location,
            when_start: form.data.starts,
            when_end: form.data.ends,
            thumbnail: form.data.thumbnail,
            completed: false,
            signups: [],
        })

        throw redirect(307, "/meetings/" + res.id + "?created=true");
    }
}