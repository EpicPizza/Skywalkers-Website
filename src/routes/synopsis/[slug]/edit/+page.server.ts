import type { FirestoreUser, SecondaryUser } from '$lib/Firebase/firebase.js';
import { firebaseAdmin, getUser, seralizeFirestoreUser } from '$lib/Firebase/firebase.server.js';
import { completeSchema, editSchema, getUserList } from '$lib/Meetings/meetings.server.js';
import { attachmentHelpers } from '$lib/Meetings/meetings.server';
import type { Role } from '$lib/Roles/role';
import { getRole, getSpecifiedRoles } from '$lib/Roles/role.server.js';
import { error, fail, redirect } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';
import { message, superValidate } from 'sveltekit-superforms/server';
import type { z } from 'zod';
import { fileTypeFromBlob, fileTypeFromBuffer, fileTypeFromStream } from 'file-type';
import { getDownloadURL } from 'firebase-admin/storage';
import path from 'path';
import { extension, lookup } from 'mime-types';

export async function load({ params, locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    if(!locals.firestoreUser.permissions.includes('EDIT_SYNOPSES')) throw error(403, "Unauthorized.");

    const ref = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('synopsis').doc(params.slug);

    const data = (await ref.get()).data();

    if(data == undefined) throw error(404, "Synopsis Not Found");

    let urls = data.urls as {url: string, type: string, name: string, location: string, code: string, ext: string }[];

    let form = await superValidate(editSchema);

    let hours = new Array<{ id: string, time: number }>();

    for(let i = 0; i < data.hours.length; i++) {
        hours.push({
            id: data.hours[i].member.id as string,
            time: data.hours[i].time as number,
        })
    }

    form.data.id = params.slug;
    form.data.synopsis = data.synopsis;
    form.data.hours = hours;

    form.data.attachments = [];
    for(let i = 0; i < urls.length; i++) {
        form.data.attachments.push({ name: urls[i].name, remove: false });
    }

    const meetingRef = firebaseAdmin.getFirestore().collection('teams').doc(locals.firestoreUser.team).collection('meetings').doc(params.slug);

    const meeting = (await meetingRef.get()).data();

    if(meeting == undefined) throw error(404, "Meeting Not Found");

    const length = (meeting.when_end.valueOf() - meeting.when_start.valueOf()) / 1000 / 60 / 60;
    
    return { 
        form: form,
        length: length,
    }
}

export const actions = {
    default: async function({ request, locals, params }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");

        if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        if(!locals.firestoreUser.permissions.includes('EDIT_SYNOPSES')) throw error(403, "Unauthorized.");

        const db = firebaseAdmin.getFirestore();

        let users = await getUserList(db, locals.firestoreUser.team);

        const team = db.collection('teams').doc(locals.firestoreUser.team);

        const synopsisRef = team.collection('synopsis').doc(params.slug);

        const synopsisData = (await synopsisRef.get()).data();

        if(synopsisData == undefined) throw error(401, "Synopsis not found.");

        const formData = await request.formData();

        const form = await superValidate(formData, editSchema);

        if(!form.valid) {
            return fail(400, { form });
        }

        let attachments = formData.getAll('attachments');

        let files = new Array<{file: File, ext: string, mime: string}>();

        console.log(attachments);

        if(attachments) {
            for(let i = 0; i < attachments.length; i++) {

                if(attachments[i] instanceof File && (attachments[i] as File).size != 0) {
                    const type = await fileTypeFromBuffer(await (attachments[i] as File).arrayBuffer());

                    console.log(type);

                    if(!type || !attachmentHelpers.checkType(type.mime)) {
                        if(type != undefined) {
                            return message(form, "Invalid attachment file type.");
                        } else {
                            const mime = lookup((attachments[i] as File).name);

                            if(!mime) {
                                return message(form, "Invalid attachment file type.");
                            }

                            console.log(extension(mime));

                            if(attachmentHelpers.checkType(mime) && !attachmentHelpers.isImage(mime)) {
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

        for(let i = 0; i < form.data.hours.length; i++) {
            if(!users.includes(form.data.hours[i].id)) {
                return message(form, "User not found.");
            }
        }

        let urls: {url: string, type: string, name: string, location: string, code: string, ext: string }[] = synopsisData.urls as any;

        let confirmedurls: {url: string, type: string, name: string, location: string, code: string, ext: string }[] = [];
        for(let i = 0; i < urls.length; i++) {
            for(let j = 0; j < form.data.attachments.length; j++) {
                if(urls[i].name == form.data.attachments[j].name && form.data.attachments[j].remove) {
                    const path = `synopses/${params.slug}/${urls[i].location}`;

                    console.log(path);

                    await new Promise((resolve) => {
                        firebaseAdmin.getBucket().deleteFiles({
                            prefix: path,
                        }, (err, files) => {
                            if(err) {
                                console.log(err);
            
                                throw error(501, "An unexpected error occurred, please contact us for further help.");
                            }
            
                            resolve(null);
                        })
                    })
                } else if(urls[i].name == form.data.attachments[j].name) {
                    confirmedurls.push(urls[i]);
                }
            }
        }

        urls = confirmedurls;

        if(urls.length + files.length > 10) {
            return message(form, "Cannot have more than 10 attachments.");
        }

        for(let i = 0; i < files.length; i++) {     
            const code = attachmentHelpers.getCode(urls);    

            const ref = firebaseAdmin.getBucket().file(`synopses/${params.slug}/${code}.${files[i].ext}`);

            try {
                await ref.save(attachmentHelpers.arrayBufferToBuffer(await files[i].file.arrayBuffer()));
                await ref.setMetadata({ contentType: files[i].mime, contentDispoition: 'attachment; filename=utf-8\'\'"' + path.parse(files[i].file.name).name + '.' + files[i].ext + '"'});
            } catch(e) {
                console.log(e);

                return message(form, "Failed to upload attachment. Please try again.");
            }

            urls.push({url: await getDownloadURL(ref), type: files[i].mime, name: path.parse(files[i].file.name).name, code: code, ext: files[i].ext, location: `${code}.${files[i].ext}` });
        }

        await db.runTransaction(async t => {
            const synopsis = {
                synopsis: form.data.synopsis,
                hours: [] as { member: DocumentReference, time: number }[],
                urls: urls,
            }

            for(let i = 0; i < form.data.hours.length; i++) {
                synopsis.hours.push({
                    member: db.collection('users').doc(form.data.hours[i].id),
                    time: form.data.hours[i].time
                })
            }

            t.update(synopsisRef, synopsis);
        })

        return message(form, "Success");
    }
}