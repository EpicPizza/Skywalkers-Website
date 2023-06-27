import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { redirect, type RequestHandler } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import { DocumentReference } from "firebase/firestore";
import safeCompare from "safe-compare";

export const load = async ({ locals }) => {
    if(locals.user == undefined) {
        throw redirect(307, "/?signin=true");
    }

    if(locals.team) {
        throw redirect(307, "/?alrverify=true");
    }

    const db = firebaseAdmin.getFirestore();

    const users = await db.collection('verify').listDocuments();

    let ref;

    let found: false | string = false;
    for(let i = 0; i < users.length; i++) {
        if(safeCompare(locals.user.uid, users[i].id)) {
            let data = (await users[i].get()).data();
            console.log("Found", data);
            if(data != undefined) {
                ref = users[i];
                found = data.code;
            };
        }
    }

    if(found == false) {
        throw redirect(307, "/verify?invalid=true");
    } else {
        const members = (await db.collection('teams').doc(found.split("-")[1]).get()).data() as any;

        const entries = Object.keys(members);

        let role;
        let foundMember: boolean = false;
        for(let i = 0; i < entries.length; i++) {
            if(safeCompare(found.split("-")[0], entries[i])) {

                role = members[found.split("-")[0] as any];

                await db.collection('teams').doc(found.split("-")[1]).update({
                    [found.split("-")[0]]: FieldValue.delete(),
                });

                foundMember = true;
            }
        }

        if(foundMember) {
            const users = await (db.collection('verify').where('code', '==', found).get())

            if(!users.empty) {
                users.forEach(async (doc) => {
                    if(locals.user != undefined && doc.id != locals.user.uid) {
                        await doc.ref.delete();
                    }
                })
            }

            if(role == undefined) {
                throw redirect(307, "/verify?invalid=true");
            }

            db.collection('users').doc(locals.user.uid).set({
                displayName: locals.user.displayName,
                photoURL: locals.user.photoURL,
                team: found.split("-")[1],
                role: role,
            })

            throw redirect(307, "/?invalidateAll=true");
        } else {
            if(ref == undefined) {
                throw redirect(307, "/verify?invalid=true");
            }

            await ref.delete();
            throw redirect(307, "/verify?invalid=true");
        }
    }
}