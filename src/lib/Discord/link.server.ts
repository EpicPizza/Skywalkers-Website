import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import type { DocumentReference } from 'firebase-admin/firestore';

export async function unlink(id: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('users').doc(id).collection('settings').doc('discord');

    const doc = await ref.get();

    let queryRef: undefined | DocumentReference = undefined;
    if(doc.exists && (doc.data()?.id != null || doc.data()?.verify != null)) {
        const id = doc.data()?.id;

        queryRef = db.collection('linked').doc(doc.data()?.verify ? doc.data()?.verify.id : id);
    }

    const user = id;

    await db.runTransaction(async t => {
        const doc = await t.get(ref);

        if(queryRef) t.delete(queryRef);

        if(doc.exists) {
            t.update(ref, {
                verify: null,
                id: null,
            });
        } else {
            t.create(ref, {
                verify: null,
                id: null,
            });
        }

        if(queryRef) firebaseAdmin.addLogWithTransaction("Unlinked their discord account.", "link", user, t);
    })
}