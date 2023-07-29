import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server";
import { error, json } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const UID = z.string().min(1).max(100);
const ROLE = z.string().min(1).max(100);

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(403, "AUTHORIZATION REQUIRED"); } 

    if(!locals.firestoreUser.permissions.includes('MANAGE_ROLES')) throw error(403);

    const req = await request.json();

    const uid = UID.parse(req.uid);
    const role = ROLE.parse(req.role);

    const db = firebaseAdmin.getFirestore();

    const userRef = db.collection('users').doc(uid);

    try {
        await userRef.get();
    } catch(e) {
        throw error(400, "User not found.");
    }

    const roleSnap = await db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(role).get();

    if(!roleSnap.exists) throw error(400, "Role not found.");

    if(roleSnap.data()?.level as number >= locals.firestoreUser.level) throw error(403);

    const team = locals.firestoreUser.team;

    await db.runTransaction(async (transaction) => { //transaction may be unnecessary rn, but will add on more later.
        const doc = await transaction.get(userRef);

        if(doc.exists) {
            const roles = await getSpecifiedRolesWithTransaction(doc.data()?.roles, transaction, team);

            let permissions = new Array<string>();
    
            let level = 0;
    
            for(let j = 0; j < roles.length; j++) {
                if(roles[j].id != roleSnap.ref.id) {
                    for(let x = 0; x < roles[j].permissions.length; x++) {
                        if(!permissions.includes(roles[j].permissions[x])) {
                            permissions.push(roles[j].permissions[x]);
                        }
                    }
    
                    if(roles[j].level > level) {
                        level = roles[j].level;
                    }
                }
            }

            transaction.update(roleSnap.ref, {
                members: FieldValue.arrayRemove(userRef),
            })
    
            transaction.update(userRef, {
                roles: FieldValue.arrayRemove(roleSnap.ref),
                permissions: permissions,
                level: level,
            })
        }
    });

    return json("success");
})