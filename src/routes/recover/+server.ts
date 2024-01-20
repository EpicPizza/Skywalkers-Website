import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { getMeeting } from "$lib/Meetings/helpers.server.js";
import { json, text } from "@sveltejs/kit";
import { Firestore, Timestamp, getFirestore } from "firebase-admin/firestore";

/*export async function GET({ url }) {
    const firebase = firebaseAdmin.getApp(true);

    const db = getFirestore(firebase);

    const meetings = (await db.collection('teams').doc('329832').collection('meetings').get()).docs;

    for(let i = 0; i < meetings.length; i++) {
        console.log("Updating", meetings[i].id);

        await getMeeting(meetings[i].id, 'NHunOzafMeUODILhchcUgfbOkAm1', '329832');
    }

    return text("Sucesss");

}
/*    const recover = url.searchParams.get('recover');

    const firebase = firebaseAdmin.getApp(true);

    const db = getFirestore(firebase);

    const meetingRef = db.collection('teams').doc('329832').collection('hours').doc('JOFQqdTyAyUyKBi1ihTz2jut8au1');

    let today = new Date();

    today.setMilliseconds(0);
    today.setSeconds(0);

    const documentSnapshot = await db.runTransaction(
        updateFunction => updateFunction.get(meetingRef),
        {readOnly: true, readTime: new Timestamp(parseInt((new Date(today.valueOf() - (1000 * 60 * 60 * 0.5)).valueOf() / 1000).toString()), 0)}
    );

    if(recover == 'true') {
        meetingRef.set(documentSnapshot.data() ?? {})

        return text("Sucesss");
    } else {
        return text(JSON.stringify(documentSnapshot, null, "\t"));
    }











    const ref = db.collection('users');

    let today = new Date();

        today.setMilliseconds(0);
        today.setSeconds(0);

    const users = (await db.runTransaction(
        updateFunction => updateFunction.get(ref),
        {readOnly: true, readTime: new Timestamp(parseInt((new Date(today.valueOf() - (1000 * 60 * 60 * 1)).valueOf() / 1000).toString()), 0)}
    )).docs;

    for(let i = 0; i < users.length; i++) {
        await users[i].ref.set({
            displayName: users[i].data()?.displayName,
            pronouns: users[i].data()?.pronouns,
            photoURL: users[i].data()?.photoURL,
            team: [ users[i].data()?.team ],
            teams: [
                {
                    team: users[i].data()?.team,
                    roles: users[i].data()?.roles,
                    role: users[i].data()?.role,
                    level: users[i].data()?.level,
                    permissions: users[i].data()?.permissions
                }
            ]
        })
    }








    let today = new Date();

        today.setMilliseconds(0);
        today.setSeconds(0);

    const logs = (await db.runTransaction(
        updateFunction => updateFunction.get(ref),
        {readOnly: true, readTime: new Timestamp(parseInt((new Date(today.valueOf() - (1000 * 60 * 60 * 1)).valueOf() / 1000).toString()), 0)}
    )).docs;

    for(let i = 0; i < logs.length; i++) {
        await logs[i].ref.set({
            ... logs[i].data(),
            team: '329832',
        })
    }
}*/