import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Role } from "$lib/Roles/role.js";
import { getRolesWithTransaction, getSpecifiedRoles, getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server.js";
import { error, json } from "@sveltejs/kit";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const UID = z.string().min(1).max(100).array().min(1);
const ROLE = z.string().min(1).max(100);

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); } 

    if(!locals.firestoreUser.permissions.includes('MANAGE_ROLES')) throw error(403);

    const req = await request.json();

    console.log(req);

    const uid = UID.parse(req.uid);
    const role = ROLE.parse(req.role);

    const db = firebaseAdmin.getFirestore();

    const userRefs = new Array<DocumentReference>();

    for(let i = 0; i < uid.length; i++) {
        userRefs.push(db.collection('users').doc(uid[i]));
    }

    try {
        for(let i = 0; i < userRefs.length; i++) {
            await userRefs[i].get();
        }
    } catch(e) {
        throw error(400, "User not found.");
    }

    const roleSnap = await db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(role).get();

    if(!roleSnap.exists) throw error(400);

    if(roleSnap.data() == undefined) throw error(400);

    if(roleSnap.data()?.level as number >= locals.firestoreUser.level) throw error(403);

    if(roleSnap.data()?.name == 'everyone') throw error(400);

    const team = locals.firestoreUser.team;

    await db.runTransaction(async (transaction) => {
        const role = (await transaction.get(roleSnap.ref)).data() as Role;

        let userPermissions = new Map<string, { permissions: string[], level: number}>()

        for(let i = 0; i < userRefs.length; i++) {
            const doc = await transaction.get(userRefs[i])

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
    
                for(let x = 0; x < role.permissions.length; x++) {
                    if(!permissions.includes(role.permissions[x])) {
                        permissions.push(role.permissions[x]);
                    }
                }
    
                if(role.level > level) {
                    level = role.level;
                }
    
                userPermissions.set(userRefs[i].id, {permissions, level});
            }
        }

        transaction.update(roleSnap.ref, {
            members: FieldValue.arrayUnion(...userRefs),
        })

        for(let i = 0; i < userRefs.length; i++) {
            if(userPermissions.get(userRefs[i].id) != undefined) {
                transaction.update(userRefs[i], {
                    roles: FieldValue.arrayUnion(roleSnap.ref),
                    permissions: userPermissions.get(userRefs[i].id)?.permissions,
                    level: userPermissions.get(userRefs[i].id)?.level,
                })
            }
        }
    });

    return json("success");
})