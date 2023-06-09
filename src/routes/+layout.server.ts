import { getFirestore, Timestamp, FieldValue, Firestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '$lib/Firebase/firebase.server';
import { redirect } from '@sveltejs/kit';

export const ssr = true;

export async function load({cookies, request, locals}) {
    const mode = cookies.get('theme');

    let user;

    if(locals.user != undefined) {
        user = {
            photoURL: locals.user.photoURL,
            displayName: locals.user.displayName,
            email: locals.user.email,
            uid: locals.user.uid,
            preload: true, //only exists for sake of comparing to real user object
        };
    } else {
        user = undefined;
    }

    return { mode: mode, team: locals.team, preload: user };
}