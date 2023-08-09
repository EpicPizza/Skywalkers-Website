import type { Code } from "$lib/Codes/codes";
import { firebaseAdmin, getPhotoURL } from "$lib/Firebase/firebase.server";
import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import safeCompare from "safe-compare";

export const load = async ({ locals }) => { //TODO: secure possible exploit to verify multiple accounts with same code
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
        const members = (await db.collection('teams').doc(found.split("-")[1]).get()).data();

        if(members == undefined) throw redirect(307, "/verify?invalid=true");

        const entries = Object.keys(members);

        const oldCodes = new Map<string, Code>(Object.entries(members));

        let role;
        let foundMember: boolean = false;
        for(let i = 0; i < entries.length; i++) {
            let correct = safeCompare(entries[i], found.split("-")[0]);
            let anyone = safeCompare("anyone", oldCodes.get(entries[i])?.access as string) 
            let access = safeCompare(locals.user.email ?? "", oldCodes.get(entries[i])?.access as string);

            if(correct && (anyone || access)) {

                role = members[found.split("-")[0] as any];

                foundMember = true;
            }
        }

        if(foundMember) {
            let photoURL = await getPhotoURL(locals.user.photoURL as string, locals.user.uid);

            await db.collection('teams').doc(found.split("-")[1]).update({
                [found.split("-")[0]]: FieldValue.delete(),
            });

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

            const everyone = (await (firebaseAdmin.getFirestore().collection('teams').doc(found.split("-")[1]).collection('roles').where('level', '==', 0)).get()).docs[0];

            let everyoneRole = {
                color: everyone.data().color as string,
                permissions: everyone.data().permissions as string[],
                level: everyone.data().level as number,
                name: everyone.data().name as string,
                connectTo: everyone.data().connectTo as string | null,
                members: [],
                id: everyone.ref.id,
            };

            db.collection('users').doc(locals.user.uid).set({
                displayName: locals.user.displayName,
                photoURL: photoURL,
                team: found.split("-")[1],
                role: role,
                roles: [],
                level: 0,
                pronouns: "",
                permissions: everyoneRole.permissions,
            })

            const kickedRef = db.collection('quarantine').doc(locals.user.uid);

            const kicked = await kickedRef.get();
    
            if(kicked.exists) {
                await kickedRef.delete();
            }

            const hoursRef = db.collection('teams').doc(found.split("-")[1]).collection('hours').doc(locals.user.uid);

            await hoursRef.set({
                total: 0,
                entries: [],
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