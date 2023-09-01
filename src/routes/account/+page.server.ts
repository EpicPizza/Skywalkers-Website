import { getUsers, sendDM } from '$lib/Discord/discord.server.js';
import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, fail } from '@sveltejs/kit';
import type { DocumentReference } from 'firebase-admin/firestore';
import { runTransaction } from 'firebase/firestore';
import safeCompare from 'safe-compare';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { unlink } from '$lib/Discord/link.server';

const connect = z.object({
    id: z.string().min(1).max(100).optional(),
    verify: z.string({ required_error: "Code is empty", invalid_type_error: "Code must be a number" }).length(6, { message : "Code must be 6 numbers long" }).regex(/^[0-9]*$/, { message: "Code must be a number."}).optional(),
})

export async function load({ locals, depends }) {
    depends("discord-link");

    const form = await superValidate(connect);

    if(locals.user && locals.firestoreUser && locals.firestoreUser.team != undefined) {
        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('users').doc(locals.user.uid).collection('settings').doc('discord');

        const doc = await ref.get();

        let id: undefined | string = undefined;

        if(doc.exists && doc.data() && doc.data()?.id != null) {
            id = doc.data()?.id as string;
        }

        return {
            stream: {
                users: getUsers(),
            },
            form: form,
            id: id,
        }
    } else {
        return {
            stream: {
                users: undefined,
            },
            form: form,
            id: undefined,
        }
    }
}

export const actions = {
    default: async function ({ locals, request }) {
        if(!locals.user || !locals.firestoreUser || locals.firestoreUser.team == undefined) return;

        const form = await superValidate(request, connect);

        if(!form.valid) {
            return fail(400, { form });
        }

        console.log(form.data);

        if(form.data.verify && form.data.verify != "") {
            const db = firebaseAdmin.getFirestore();

            const ref = db.collection('users').doc(locals.user.uid).collection('settings').doc('discord');

            const doc = await ref.get();

            if(!doc.exists || !doc.data() || doc.data()?.verify == null) {
                return message(form, "Code Not Found");
            }

            const code = doc.data()?.verify.code as string;
            const timestamp = doc.data()?.verify.timestamp as number;
            const id = doc.data()?.verify.id as string;

            if(new Date().valueOf() - timestamp > (1000 * 60 * 60 * 2)) {
                return message(form, "Stale Code, Please Retry from Start");
            }   

            if(!safeCompare(code, form.data.verify)) {
                return message(form, "Invalid Code");
            }

            const queryRef = db.collection('linked').doc(id);

            const userId = locals.user.uid;

            await db.runTransaction(async t => {
                const doc = await t.get(ref);

                t.update(queryRef, {
                    temp: null,
                    to: userId,
                });

                if(doc.exists) {
                    t.update(ref, {
                        verify: null,
                        id: id,
                    });
                } else {
                    t.create(ref, {
                        verify: null,
                        id: id,
                    });
                }

                firebaseAdmin.addLogWithTransaction("Linked their discord account.", "link", userId, t);
            })

            return message(form, "Verified");
        } else if(form.data.id && form.data.id != "") {
            const db = firebaseAdmin.getFirestore();

            const ref = db.collection('users').doc(locals.user.uid).collection('settings').doc('discord');

            const code = getRandomCode();

            const users = await getUsers();

            let found = false;
            for(let i = 0; i < users.length; i++) {
                if(users[i].id == form.data.id) {
                    found = true;
                }
            }
            if(found == false) return message(form, "Discord User Not Found");

            const queryRef = db.collection('linked').doc(form.data.id);

            const queryDocCheck = await queryRef.get();
            if(queryDocCheck.exists && queryDocCheck.data()?.to != null) return message(form, "Discord User Already Linked");

            const id = locals.user.uid;

            await db.runTransaction(async t => {

                const doc = await t.get(ref);

                const queryDoc = await t.get(queryRef);

                if(queryDoc.exists && queryDoc.data()?.to != null) {
                    return;
                } else if(queryDoc.exists) {
                    const oldId = queryDoc.data()?.temp;

                    t.update(queryRef, {
                        temp: id,
                        to: null,
                    });

                    if(oldId != id) {
                        t.delete(db.collection('users').doc(oldId).collection('settings').doc('discord'));
                    }
                } else {
                    t.create(queryRef, {
                        temp: id,
                        to: null,
                    });
                }

                if(doc.exists) {
                    t.update(ref, {
                        verify: { timestamp: new Date().valueOf(), code: code, id: form.data.id },
                        id: null
                    });
                } else {
                    t.create(ref, {
                        verify: { timestamp: new Date().valueOf(), code: code, id: form.data.id },
                        id: null
                    });
                }
            })

            return message(form, "Code Sent");
        } else {
            await unlink(locals.user.uid);
        }
    }
}

const getRandomNumber = () => {
    return crypto.getRandomValues(new Uint32Array(1))[0]/2**32;
}

const getRandomCode = () => {
    let code = "";

    for(let i = 0; i < 6; i++) {
        code += Math.floor(getRandomNumber() * 9 + 1);
    }

    return code;
}