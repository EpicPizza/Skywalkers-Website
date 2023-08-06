import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, getUser, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { completeSchema, getUserList } from '$lib/Meetings/meetings.server.js';
import type { Role } from '$lib/Roles/role';
import { getRole, getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { z } from 'zod';
import { fileTypeFromBlob, fileTypeFromBuffer, fileTypeFromStream } from 'file-type';
import { getDownloadURL } from 'firebase-admin/storage';

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

        let files = new Array<File>()

        if(attachments) {
            for(let i = 0; i < attachments.length; i++) {

                if(attachments[i] instanceof File) {
                    const type = await fileTypeFromBuffer(await (attachments[i] as File).arrayBuffer());

                    console.log(type);

                    if(!type || !checkType(type.mime)) {
                        if(type != undefined) {
                            return message(form, "Invalid attachment file type.");
                        }
                    } else {
                        files.push(attachments[i] as File);
                    }
                }
            }
        }

        for(let i = 0; i < files.length; i++) {
            for(let j = 0; j < files.length; j++) {
                if(files[i].name == files[j].name && j != i) {
                    return message(form, "Cannot have attachments with duplicate names.");
                }
            }

            if(files[i].size / 1024 / 1024 > 20) {
                return message(form, files[i].name + " is too large.");
            }

            if(files[i].name.length > 100) {
                return message(form, files[i].name + " has a name too long.");
            }
        }

        const db = firebaseAdmin.getFirestore();

        const team = db.collection('teams').doc(locals.firestoreUser.team);

        const meetingRef = team.collection('meetings').doc(form.data.id);

        const synopsisRef = team.collection('synopsis').doc(form.data.id);

        const meeting = await meetingRef.get();

        if(!meeting.exists || meeting.data() == undefined) {
            return message(form, "Meeting not found.");
        }

        if(!locals.firestoreUser.permissions.includes('ADD_SYNOPSES') && meeting.data()?.synopsis.id != locals.user.uid && meeting.data()?.lead.id != locals.user.uid) throw error(403, "Unauthorized.");

        let users = await getUserList(db, locals.firestoreUser.team);

        for(let i = 0; i < form.data.hours.length; i++) {
            if(!users.includes(form.data.hours[i].id)) {
                return message(form, "User not found.");
            }
        }

        let urls: {url: string, type: string, name: string}[] = [];

        for(let i = 0; i < files.length; i++) {
            const ref = firebaseAdmin.getBucket().file(`synopses/${params.slug}/${files[i].name}`);

            try {
                await ref.save(arrayBufferToBuffer(await files[i].arrayBuffer()));
            } catch(e) {
                console.log(e);

                return message(form, "Failed to upload attachment. Please try again.");
            }

            urls.push({url: await getDownloadURL(ref), type: (await fileTypeFromBuffer(await (attachments[i] as File).arrayBuffer()))?.mime ?? "plain/text", name: files[i].name});
        }

        await db.runTransaction(async t => {
            t.update(meetingRef, {
                completed: true,
            })

            const synopsis = {
                synopsis: form.data.synopsis,
                hours: [] as { member: DocumentReference, time: number }[],
                urls: urls
            }

            for(let i = 0; i < form.data.hours.length; i++) {
                synopsis.hours.push({
                    member: db.collection('users').doc(form.data.hours[i].id),
                    time: form.data.hours[i].time,
                })
            }

            t.create(synopsisRef, synopsis);
        })

        throw redirect(307, "/meetings/" + form.data.id + "");
    }
}

function arrayBufferToBuffer(ab: ArrayBuffer) {
    let buffer = Buffer.alloc(ab.byteLength);
    let view = new Uint8Array(ab);

    for (var i = 0; i < buffer.length; ++i) {
        buffer[i] = view[i];
    }

    return buffer;
}

function checkType(type: string) {
    switch(type) {
        case 'image/apng':
        case 'image/avif':
        case 'image/gif':
        case 'image/jpeg':
        case 'image/png':
        case 'image/svg+xml':
        case 'image/webp':
        case 'application/pdf':
        case 'text/plain':
            return true;
        default:
            return false;
    }
}