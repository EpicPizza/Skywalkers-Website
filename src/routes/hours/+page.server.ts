import type { SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Hours } from "$lib/Hours/hours.server";
import { getMember } from "$lib/Members/manage.server.js";
import { error, redirect } from "@sveltejs/kit";

export async function load({ locals, params, url }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

    const db = firebaseAdmin.getFirestore();

    const hoursRef = db.collection("teams").doc(locals.firestoreUser.team).collection('hours');

    const docs = (await hoursRef.get()).docs;

    const users = new Array<{ total: number, member: SecondaryUser }>();

    for(let i = 0; i < docs.length; i++) {
        if(docs[i].data() != undefined) {
            let hours = docs[i].data() as Hours;

            let member = await getMember(docs[i].id);

            if(docs[i].id == locals.user.uid) {
                users.unshift({
                    total: hours.total,
                    member: member,
                })
            } else {
                users.push({
                    total: hours.total,
                    member: member,
                })
            }
        }
    }

    return { hours: users, }
}