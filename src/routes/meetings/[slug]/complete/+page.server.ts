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

format.plugin(meridiem);

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Meeting Not Found");

    if(data.completed == true) throw error(404, "Not Completable; Meeting Completed");

    if(!locals.firestoreUser.permissions.includes('ADD_SYNOPSES') && data.synopsis.id != locals.user.uid && data.lead.id != locals.user.uid) throw error(403, "Unauthorized.");

    let signups = new Array<SecondaryUser>();

    for(let i = 0; i < data.signups.length; i++) {
        const user = (await db.collection('users').doc(data.signups[i]).get()).data();

        if(user != undefined) {
            signups.push({
                ...user,
                roles: await getSpecifiedRoles(user.roles),
                id: data.signups[i],
            } as SecondaryUser);
        }
    }

    let synopsis; 
    if(data.synopsis != null) {
        synopsis = await seralizeFirestoreUser((await data.synopsis.get()).data(), data.synopsis.id)
    }

    let mentor;
    if(data.mentor != null) {
        mentor = await seralizeFirestoreUser((await data.mentor.get()).data(), data.mentor.id)
    }

    let role;
    if(data.role != null) {
        role = await getRole(data.role, locals.firestoreUser.team);
    }

    const meeting = {
        name: data.name as string,
        lead: await seralizeFirestoreUser((await data.lead.get()).data(), data.lead.id),
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
            time: meeting.length,
            id: signups[i].id
        })    
    }

    form.data.hours = hours;
    form.data.discord = true;
    
    return { 
        meeting: meeting,
        form: form,
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

        console.log(formData);

        let attachments = formData.getAll('attachments');

        let files = new Array<{file: File, ext: string, mime: string}>()

        if(attachments) {
            for(let i = 0; i < attachments.length; i++) {

                if(attachments[i] instanceof File && (attachments[i] as File).size != 0) {
                    const type = await fileTypeFromBuffer(await (attachments[i] as File).arrayBuffer());

                    console.log(type);
                    console.log((attachments[i] as File).name)

                    if(!type || !attachmentHelpers.checkType(type.mime)) {
                        if(type != undefined) {
                            return message(form, "Invalid attachment file type.");
                        } else {
                            const mime = lookup((attachments[i] as File).name);

                            if(!mime) {
                                return message(form, "Invalid attachment file type.");
                            }

                            console.log(extension(mime));

                            if(attachmentHelpers.checkType(mime) && attachmentHelpers.isSecure(mime)) {
                                files.push({file: attachments[i] as File, ext: extension(mime) ? extension(mime) as string : "text/plain", mime: mime})
                            } else {
                                return message(form, "Invalid attachment file type.");
                            }
                        }
                    } else {
                        files.push({file: attachments[i] as File, ext: type.ext, mime: type.mime});
                    }
                }
            }
        }

        for(let i = 0; i < files.length; i++) {
            for(let j = 0; j < files.length; j++) {
                if(path.parse(files[i].file.name).base == path.parse(files[j].file.name).base && j != i) {
                    return message(form, "Cannot have attachments with duplicate names.");
                }
            }

            if(files[i].file.size / 1024 / 1024 > 100) {
                return message(form, path.parse(files[i].file.name).base + " is too large.");
            }

            if(files[i].file.name.length > 100) {
                return message(form, path.parse(files[i].file.name).base + " has a name too long.");
            }
        }

        if(files.length > 10) {
            return message(form, "Cannot have more than 10 attachments.");
        }

        const db = firebaseAdmin.getFirestore();

        const teamRef = db.collection('teams').doc(locals.firestoreUser.team);

        const meetingRef = teamRef.collection('meetings').doc(form.data.id);

        const synopsisRef = teamRef.collection('synopsis').doc(form.data.id);

        const meeting = await meetingRef.get();

        if(!meeting.exists || meeting.data() == undefined) {
            return message(form, "Meeting not found.");
        }

        const signups = meeting.data()?.signups as string[];

        if(!locals.firestoreUser.permissions.includes('ADD_SYNOPSES') && meeting.data()?.synopsis.id != locals.user.uid && meeting.data()?.lead.id != locals.user.uid) throw error(403, "Unauthorized.");

        let users = await getUserList(db, locals.firestoreUser.team);

        let names: string[] = [];

        for(let i = 0; i < form.data.hours.length; i++) {
            if(!users.includes(form.data.hours[i].id)) {
                return message(form, "User not found.");
            } else if(form.data.discord) {
                let user = await seralizeFirestoreUser((await db.collection('users').doc(form.data.hours[i].id).get()).data(), form.data.hours[i].id);

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

        for(let i = 0; i < files.length; i++) {     
            const code = attachmentHelpers.getCode(urls);    

            const ref = firebaseAdmin.getBucket().file(`synopses/${params.slug}/${code}.${files[i].ext}`);

            try {
                await ref.save(attachmentHelpers.arrayBufferToBuffer(await files[i].file.arrayBuffer()));
                await ref.setMetadata({ contentDispoition: 'inline; filename*=utf-8\'\'"' + path.parse(files[i].file.name).name + '.' + files[i].ext + '"'});
            } catch(e) {
                console.log(e);

                return message(form, "Failed to upload attachment. Please try again.");
            }

            urls.push({url: await getDownloadURL(ref), type: files[i].mime, name: path.parse(files[i].file.name).name, code: code, ext: files[i].ext, location: `${code}.${files[i].ext}` });
        }

        const uid = locals.user.uid;
        const team = locals.firestoreUser.team;

        let data = meeting.data() as any;

        let role;
        if(data.role != null) {
            role = await getRole(data.role, locals.firestoreUser.team);
        }

        const meetingObject = {
            name: data.name as string,
            lead: await seralizeFirestoreUser((await data.lead.get()).data(), data.lead.id),
            role: role,
            location: data.location as string,
            when_start: data.when_start.toDate() as Date,
            when_end: data.when_end.toDate() as Date,
            thumbnail: data.thumbnail as string,
            completed: data.completed as boolean,
            id: params.slug as string,
            signups: []
        }

        console.log("Running Transaction");

        await db.runTransaction(async t => {
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
                    entries: FieldValue.arrayUnion({ total: form.data.hours[i].time, id: form.data.id, latest: 0, history: [{ total: form.data.hours[i].time, link: DOMAIN + "/synopsis/" + form.data.id, reason: meetingObject.name + " - " + format.format(meetingObject.when_start, "M/D/Y"), id: uid, date: new Date().valueOf(), indicator: meetingIndicator }]})
                }});
            }

            for(let i = 0; i < toUpdate.length; i++) {
                t.update(toUpdate[i].ref, toUpdate[i].data);
            }

            t.create(synopsisRef, synopsis);

            t.update(meetingRef, {
                completed: true,
            })

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
                meetingObject.name + " - " + format.format(meetingObject.when_start, "M/D/Y"), 
                (role && role.connectTo ? "<@&" + role.connectTo + "> " : "") + `<t:${meetingObject.when_start.valueOf() / 1000}:F> to <t:${meetingObject.when_end.valueOf() / 1000}:t>` + (nameString.length != 0 ? " ( " + nameString + " )" : "") + ": " + form.data.synopsis, 
                urls,
                DOMAIN + "/synopsis/" + form.data.id,
            );
        }
 
        throw redirect(307, "/meetings/" + form.data.id + "");
    }
}