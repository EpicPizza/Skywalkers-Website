import { DEV } from '$env/static/private';
import { firebaseAdmin } from '$lib/Firebase/firebase.server';
import { getMeeting, getMeetings, sendConfirmations } from '$lib/Meetings/helpers.server.js';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

export async function POST({ request, params, url, locals }) {
    const team = locals.unverifiedTeam;

    if(team == null) throw error(400, "Not allowed.");

    let today = new Date();
    today.setHours(DEV == "TRUE" ? 0 : today.getHours() - 8);
    today.setDate(today.getDate() + 1);
    today.setHours(DEV == "TRUE" ? 0 : 8);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

    let tomorrow = new Date();
    tomorrow.setHours(DEV == "TRUE" ? 0 : tomorrow.getHours() - 8);
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(DEV == "TRUE" ? 0 : 8);
    tomorrow.setMinutes(0);
    tomorrow.setSeconds(0);
    tomorrow.setMilliseconds(0);

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').where('confirmations', '==', null).where('completed', '==', false).where('starts', '>=', today).where('starts', '<=', tomorrow).orderBy('starts').limit(50);

    const meetings = await getMeetings(ref, "", team);

    for(let i = 0; i < meetings.length; i++) {
        try {
            await sendConfirmations(meetings[i], "", team);
        } catch(e) {
            console.log(e);
        }
    }

    return new Response("No Content", { status: 200 });
}