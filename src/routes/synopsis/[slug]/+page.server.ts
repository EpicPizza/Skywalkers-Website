import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { getMember } from '$lib/Members/manage.server.js';
import { getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    const meeting = {
        name: data.name as string,
        location: data.location as string,
        when_start: data.when_start.toDate() as Date,
        when_end: data.when_end.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        id: params.slug as string,
        signups: []
    }

    const synopsisRef = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('synopsis').doc(params.slug);

    const synopsis = (await synopsisRef.get()).data();

    if(synopsis == undefined) throw error(404, "Synopsis Not Found");

    let hours: { member: SecondaryUser, time: number }[] = [];

    for(let i = 0; i < synopsis.hours.length; i++) {
        let member = await getMember(synopsis.hours[i].member.id); 

        hours.push({
            member,
            time: synopsis.hours[i].time,
        })
    }

    return { 
        meeting: meeting,
        synopsis: {
            body: synopsis.synopsis as string,
            hours: hours,
            attachments: synopsis.urls as {url: string, type: string, name: string, location: string, code: string, ext: string }[],
        }
    };
}