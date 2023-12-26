import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, getUser, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { completeSchema, getUserList } from '$lib/Meetings/meetings.server.js';
import type { Role } from '$lib/Roles/role';
import { getRole, getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import { coerce, type z } from 'zod';
import { fileTypeFromBlob, fileTypeFromBuffer, fileTypeFromStream } from 'file-type';
import { getDownloadURL } from 'firebase-admin/storage';
import path from 'path';
import { attachmentHelpers } from '$lib/Meetings/meetings.server';
import { sendSynopsis } from '$lib/Discord/discord.server.js';
import format from "date-and-time";
import meridiem from "date-and-time/plugin/meridiem";
import { DOMAIN } from '$env/static/private';
import { charset, extension, lookup } from 'mime-types';
import { meetingIndicator, type Hours, type Indicator } from '$lib/Hours/hours.server.js';
import colors from 'tailwindcss/colors.js';
import { getFetchedMeeting, type FetchedMeeting, completeMeeting } from '$lib/Meetings/helpers.server';
import { getMember } from '$lib/Members/manage.server.js';
import { getQueue, getQueueById, type Queue } from '$lib/Upload/helpers.server.js';

format.plugin(meridiem);

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    let meeting: FetchedMeeting | false = false;
    
    try {
        meeting = await getFetchedMeeting(params.slug, locals.user.uid, locals.firestoreUser.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

    const length = (meeting.ends.valueOf() - meeting.starts.valueOf()) / 1000 / 60 / 60;
    
    let form = await superValidate(completeSchema);

    form.data.id = meeting.id;

    let hours = new Array<{ id: string, time: number }>()

    for(let i = 0; i < meeting.signups.length; i++) {
        hours.push({
            time: length,
            id: meeting.signups[i].id
        })    
    }

    form.data.hours = hours;
    form.data.discord = true;
    
    return { 
        meeting: meeting,
        form: form,
        length: length,
        
    }
}

export const actions = {
    default: async function({ request, locals, params }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");

        if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        const formData = await request.formData();

        const form = await superValidate(formData, completeSchema);

        if(!form.valid) {
            return fail(400, { form });
        }
        
        const db = firebaseAdmin.getFirestore();

        const teamRef = db.collection('teams').doc(locals.firestoreUser.team);

        const meetingRef = teamRef.collection('meetings').doc(form.data.id);

        const synopsisRef = teamRef.collection('synopsis').doc(form.data.id);

        let meeting: FetchedMeeting | false = false;
    
        try {
            meeting = await getFetchedMeeting(params.slug, locals.user.uid, locals.firestoreUser.team);
        } catch(e: any) {
            if('type' in e && e.type == "display") {
                throw error(404, e.message);
            } else {
                console.log(e);
            }
        }

        if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

        const notion = meeting.notion;

        const signups = Array.from(meeting.signups, (signup) => signup.id);

        let users = await getUserList(db, locals.firestoreUser.team);

        let names: string[] = [];

        for(let i = 0; i < form.data.hours.length; i++) {
            if(!users.includes(form.data.hours[i].id)) {
                return message(form, "User not found.");
            } else if(form.data.discord) {
                let user = await getMember(form.data.hours[i].id);

                if(user) {
                    console.log(user.displayName);
                    names.push(user.displayName);
                }
            }
        }

        for(let j = 0; j < signups.length; j++) {
            let found = false;

            for(let i = 0; i < form.data.hours.length; i++) {
                if(form.data.hours[i].id == signups[j]) {
                    found = true;
                }
            }

            if(found == false) {
                form.data.hours.push({
                    id: signups[j],
                    time: 0,
                })
            }
        }

        let urls: {url: string, type: string, name: string, location: string, code: string, ext: string }[] = [];

        let queues: Queue[] = []

        for(let i = 0; i < form.data.attachments.length; i++) {     
            const queue = await getQueueById(form.data.attachments[i]);

            if(!queue) return message(form, "File not found.");

            if(!queue.finished) return message(form, "Please make sure all files have finished uploading.");

            if(!queue.type) return message(form, "Malformed file found.");

            queues.push(queue);
        }

        for(let i = 0; i < queues.length; i++) {     
            const code = attachmentHelpers.getCode(urls);    

            const desRef = firebaseAdmin.getBucket().file(`synopses/${params.slug}/${code}.${queues[i].type?.ext ?? "txt"}`);
            const locRef = firebaseAdmin.getBucket().file(`uploads/${queues[i].location}/complete`);
            //const locFol = firebaseAdmin.getBucket().file(`uploads/${queues[i].location}`);

            try {
                await locRef.copy(desRef);
                await desRef.setMetadata({ contentDispoition: 'inline; filename*=utf-8\'\'"' + queues[i].name + '.' + queues[i].type?.ext ?? "txt" + '"'});
               //await locFol.delete();
            } catch(e) {
                console.log(e);

                return message(form, "Failed to upload attachment. Please try again.");
            }

            urls.push({url: await getDownloadURL(desRef), type: queues[i].type?.mime ?? "text/plain", name: queues[i].name, code: code, ext: queues[i].type?.ext ?? "txt", location: `${code}.${queues[i].type?.ext ?? "txt"}` });
        }

        const uid = locals.user.uid;
        const team = locals.firestoreUser.team;

        console.log("Running Transaction");

        await db.runTransaction(async t => {
            if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

            const synopsis = {
                synopsis: form.data.synopsis,
                hours: [] as { member: DocumentReference, time: number }[],
                urls: urls
            }

            let toUpdate: {ref: DocumentReference, data: { total: number, entries: FieldValue }}[] = new Array();

            for(let i = 0; i < form.data.hours.length; i++) {
                synopsis.hours.push({
                    member: db.collection('users').doc(form.data.hours[i].id),
                    time: form.data.hours[i].time,
                });

                const ref = db.collection('teams').doc(team).collection('hours').doc(form.data.hours[i].id);

                const doc = await t.get(ref);

                if(!doc.exists) throw error(400, "Hours not found.");

                const data = doc.data() as Hours;

                if(!data) throw error(400, "Hours not found.");

                console.log("getting 2");

                toUpdate.push({ref, data: {
                    total: data.total + form.data.hours[i].time,
                    entries: FieldValue.arrayUnion({ total: form.data.hours[i].time, id: form.data.id, latest: 0, history: [{ total: form.data.hours[i].time, link: DOMAIN + "/synopsis/" + form.data.id, reason: meeting.name + " - " + format.format(meeting.starts, "M/D/Y"), id: uid, date: new Date().valueOf(), indicator: meetingIndicator }]})
                }});
            }

            for(let i = 0; i < toUpdate.length; i++) {
                t.update(toUpdate[i].ref, toUpdate[i].data);
            }

            t.create(synopsisRef, synopsis);

            await completeMeeting(t, notion, meetingRef, true, synopsis);

            firebaseAdmin.addLogWithTransaction("Meeting completed.", "event", uid, t);
        })

        if(form.data.discord) {
            let nameString = "";

            for(let i = 0; i < names.length; i++) {
                nameString += names[i] + ", ";
            }

            if(nameString.length > 0) nameString = nameString.substring(0, nameString.length - 2);

            console.log(nameString);

            await sendSynopsis(
                meeting.name + " - " + format.format(meeting.starts, "M/D/Y"), 
                (meeting.role && meeting.role.connectTo ? "<@&" + meeting.role.connectTo + "> " : "") + `<t:${meeting.starts.valueOf() / 1000}:F> to <t:${meeting.ends.valueOf() / 1000}:t>` + (nameString.length != 0 ? " ( " + nameString + " )" : "") + ": " + form.data.synopsis, 
                urls,
                DOMAIN + "/synopsis/" + form.data.id,
            );
        }
 
        throw redirect(307, "/meetings/" + form.data.id + "");
    }
}