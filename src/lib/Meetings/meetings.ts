import type { firebaseClient } from "$lib/Firebase/firebase";
import type { Warning } from "$lib/stores";
import { DocumentReference, arrayRemove, arrayUnion, doc, getDoc, runTransaction } from "firebase/firestore";
import { get, type Writable } from "svelte/store";

export async function add(id: string, warn: Writable<Warning | undefined>, client: ReturnType<typeof firebaseClient>, team: string): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.teams == undefined) return;

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.teams == undefined) return;
        transaction.update(ref, {'signups': arrayUnion(user.uid) });
    });
}

export async function remove(id: string, warn: Writable<Warning | undefined>, client: ReturnType<typeof firebaseClient>, team: string): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.teams == undefined) throw new Error("Not Verified");

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.teams == undefined) return;

        transaction.update(ref, {'signups': arrayRemove(user.uid) });
    })
}

export async function removeOtherMember(id: string, warn: Writable<Warning | undefined>, member: string, client: ReturnType<typeof firebaseClient>, team: string): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.teams == undefined) throw new Error("Not Verified");

    const db = client.getFirestore();

    const ref = doc(client.getFirestore(), "teams", team, "meetings", id);

    await runTransaction(db, async (transaction) => {
        if(user == undefined || 'preload' in user || user.teams == undefined) return;

        transaction.update(ref, {'signups': arrayRemove(member) });
    })
}

export async function deleteMeeting(id: string, client: ReturnType<typeof firebaseClient>, team: string): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.teams == undefined) throw new Error("Not Verified");

    await fetch('/t/' + team + '/api/meetings/delete', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            meetings: [id],
        }),
    })
}

export async function deleteMeetings(ids: string[], client: ReturnType<typeof firebaseClient>, team: string): Promise<undefined> {
    let user = get(client);

    if(user == undefined || 'preload' in user || user.teams == undefined) throw new Error("Not Verified");

    await fetch('/t/' + team + '/api/meetings/delete', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            meetings: ids,
        }),
    })
}

export function isImage(type: string) {
    switch(type) {
        case 'image/apng':
        case 'image/avif':
        case 'image/gif':
        case 'image/jpeg':
        case 'image/png':
        case 'image/webp':
            return true;
        case 'application/pdf':
        case 'text/plain':
        case 'application/json':
        case 'text/csv':
        case 'application/vnd.ms-powerpoint':
        case 'application/vnd.oasis.opendocument.presentation':
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/vnd.oasis.opendocument.text':
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.oasis.opendocument.spreadsheet':
        default:
            return false;
    }
}