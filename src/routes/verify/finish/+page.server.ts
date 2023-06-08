import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { redirect, type RequestHandler } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import { DocumentReference } from "firebase/firestore";
import safeCompare from "safe-compare";

export const load = async ({ locals }) => {
    if(locals.user == undefined) throw redirect(307, "/?signin=true");

    if(locals.user.customClaims != undefined && locals.user.customClaims['team'] == true) {
        throw redirect(307, "/?alrverify=true");
    }

    const db = firebaseAdmin.getFirestore();

    const users = await db.collection('users').listDocuments();

    let ref;

    let found: false | string = false;
    for(let i = 0; i < users.length; i++) {
        if(safeCompare(locals.user.uid, users[i].id)) {
            let data = (await users[i].get()).data();
            console.log("Found", data);
            if(data != undefined) {
                ref = users[i];
                found = data.verify;
            };
        }
    }

    if(found == false) {
        throw redirect(307, "/verify?invalid=true");
    } else {
        const members = (await db.collection('teams').doc(found.split("-")[1]).get()).data() as Object;

        const entries = Object.keys(members);

        let foundMember: boolean = false;
        for(let i = 0; i < entries.length; i++) {
            if(safeCompare(found.split("-")[0], entries[i])) {
                await db.collection('teams').doc(found.split("-")[1]).update({
                    [found.split("-")[0]]: FieldValue.delete(),
                });

                foundMember = true;
            }
        }

        if(foundMember) {
            await firebaseAdmin.getAuth().setCustomUserClaims(locals.user.uid, { team: true });

            const users = await (db.collection('users').where('verify', '==', found).get())

            if(!users.empty) {
                users.forEach(async (doc) => {
                    if(doc.id != locals.user?.uid) {
                        await doc.ref.delete();
                    }
                })
            }

            throw redirect(307, "/");
        } else {
            await ref?.delete();
            throw redirect(307, "/verify?invalid=true");
        }
    }
}