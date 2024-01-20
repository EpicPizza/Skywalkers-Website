import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { type FetchedMeeting, getFetchedMeeting, addGuestSignUp, removeGuestSignup } from "$lib/Meetings/helpers.server";
import { error, redirect } from "@sveltejs/kit";
import safeCompare from "safe-compare";
import { z } from "zod";

const SignUp = z.string().min(1).max(100);

export async function POST({ params, locals, url, request }) {
    const checkingPublic = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.unverifiedTeam ?? "000000").collection('settings').doc('meetings').get()).data()?.public ?? false;

    if(checkingPublic && safeCompare(checkingPublic, url.searchParams.get('public') ?? "000000")) {
        if(locals.team == locals.unverifiedTeam) {
            throw redirect(307, "/t/" + locals.team + "/meetings/" + params.slug)
        }

        locals.team = locals.unverifiedTeam as string;
    } else {
        if(locals.user == undefined) throw error(401, "Sign In Required");

        if(locals.team == null || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        if(!locals.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");
    }

    let meeting: FetchedMeeting | false = false;
    
    try {
        meeting = await getFetchedMeeting(params.slug, locals.user ? locals.user.uid : "000000", locals.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

    if(meeting.completed) throw error(400, "Meeting is already completed.");

    let signUp = "";

    try {
        signUp = SignUp.parse((await request.json()).signup);
    } catch(e) {
        console.log(e);

        throw error(400, "Error parsing.");
    }

    if(meeting.guests.includes(signUp)) throw error(400, "Duplicate signup.");

    console.log(signUp);

    await addGuestSignUp(signUp, meeting.id, locals.team);

    return new Response("No Content", { status: 200 });
}

export async function DELETE({ params, locals, url, request }) {
    const checkingPublic = (await firebaseAdmin.getFirestore().collection('teams').doc(locals.unverifiedTeam ?? "000000").collection('settings').doc('meetings').get()).data()?.public ?? false;

    if(checkingPublic && safeCompare(checkingPublic, url.searchParams.get('public') ?? "000000")) {
        if(locals.team == locals.unverifiedTeam) {
            throw redirect(307, "/t/" + locals.team + "/meetings/" + params.slug)
        }

        locals.team = locals.unverifiedTeam as string;
    } else {
        if(locals.user == undefined) throw error(401, "Sign In Required");

        if(locals.team == null || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        if(!locals.permissions.includes('VIEW_MEETINGS')) throw error(403, "Unauthorized.");
    }

    let meeting: FetchedMeeting | false = false;
    
    try {
        meeting = await getFetchedMeeting(params.slug, locals.user ? locals.user.uid : "000000", locals.team);
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            throw error(404, e.message);
        } else {
            console.log(e);
        }
    }

    if(!meeting) throw error(404, 'Huh, for some reason the meeting is not here.');

    if(meeting.completed) throw error(400, "Meeting is already completed.");

    let signUp = "";

    try {
        signUp = SignUp.parse(url.searchParams.get('signup'));
    } catch(e) {
        console.log(e);

        throw error(400, "Error parsing.");
    }

    console.log(signUp);

    await removeGuestSignup(signUp, meeting.id, locals.team);

    return new Response("No Content", { status: 200 });
}