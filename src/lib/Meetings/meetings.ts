import type { firebaseClient } from "$lib/Firebase/firebase";
import { DocumentReference, arrayRemove, arrayUnion, doc, getDoc, runTransaction } from "firebase/firestore";
import { get } from "svelte/store";

export async function add(id: string, client: ReturnType<typeof firebaseClient>): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.team == undefined) return;

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", user.team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.team == undefined) return;
        transaction.update(ref, {'signups': arrayUnion(user.uid) });
    })
}

export async function remove(id: string, client: ReturnType<typeof firebaseClient>): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.team == undefined) throw new Error("Not Verified");

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", user.team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.team == undefined) return;

        transaction.update(ref, {'signups': arrayRemove(user.uid) });
    })
}

export async function deleteMeeting(id: string, client: ReturnType<typeof firebaseClient>): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.team == undefined) throw new Error("Not Verified");

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", user.team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        transaction.delete(ref);
    })
}