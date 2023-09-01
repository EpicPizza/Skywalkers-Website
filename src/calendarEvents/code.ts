import { ADMIN, DEV, OWNER } from '$env/static/private';
import { getCalendar, getClient, getClientWithCrendentials } from '$lib/Google/client';
import { editEvent, getEvent } from '$lib/Google/calendar';
import { sendDM } from '$lib/Discord/discord.server';
import type { DocumentData } from 'firebase-admin/firestore';
import { firebaseAdmin } from '$lib/Firebase/firebase.server';

export default async function editAttendees(data: ReturnType<DocumentData["data"]>) {
    const client = await getClientWithCrendentials();

    if(client == undefined) {
        if(DEV == 'TRUE') {
            return;
        }

        await sendDM("Authorization Needed", OWNER);

        process.exit();
    }

    const calendar = await getCalendar();

    if(calendar == undefined) {
        if(DEV == 'TRUE') {
            return;
        }

        await sendDM("Authorization Needed", OWNER);

        process.exit();
    }

    const id = data.calendar;

    const users = await firebaseAdmin.getAuth().getUsers(Array.from(data.signups, (x) => ({ uid: x as string })));

    const attendees = Array.from(users.users, x => ({ email: x.email as string }));

    await editEvent(client, id, calendar, { attendees: attendees });
}