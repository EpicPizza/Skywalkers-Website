import { DocumentReference, doc, getDoc, runTransaction } from "firebase/firestore";
import { client } from '$lib/Firebase/firebase.js';
import { get } from "svelte/store";

export async function add(id: string) {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.team == undefined) return;

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", user.team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.team == undefined) return;

        const meeting = await getDoc(ref);

        if(meeting == undefined) {
            throw new Error("Document not found?");
        }

        const newSignups: DocumentReference[] = [... (meeting.data() as any).signups, doc(db, "users", user.uid)];

        transaction.update(ref, {'signups': newSignups });
    })
}

export async function remove(id: string) {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.team == undefined) return;

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", user.team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.team == undefined) return;

        const uid = user.uid;

        const meeting = await getDoc(ref);

        if(meeting == undefined) {
            throw new Error("Document not found?");
        }

        const newSignups: DocumentReference[] = ((meeting.data() as any).signups as DocumentReference[]).filter(value => value.id != uid);

        transaction.update(ref, {'signups': newSignups });
    })
}