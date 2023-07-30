import { firebaseAdmin } from '$lib/Firebase/firebase.server.js';
import { error, redirect } from '@sveltejs/kit';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

export async function load({ locals, url }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");
    
    return { meetings: [] as Meeting[], loading: true, completed: true, deleted: url.searchParams.get("deleted") === 'true' ? true : false };
}

interface Meeting {
    name:  string,
    id: string,
    location: string,
    thumbnail:  string,
    when_start: Date,
    when_end: Date,
    signedup: boolean,
}