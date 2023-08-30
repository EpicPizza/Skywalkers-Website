import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Role } from "$lib/Roles/role";
import { getRolesWithTransaction, getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server";
import { error, json } from "@sveltejs/kit";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { runTransaction } from "firebase/firestore";
import { z } from "zod";

const ROLE = z.string().min(1).max(100);

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); } 

    if(!locals.firestoreUser.permissions.includes('MANAGE_ROLES')) throw error(403);

    const req = await request.json();

    const role = ROLE.parse(req.role);

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(role);

    let roleCheck = await ref.get();

    if(!roleCheck.exists) throw error(400);

    if(roleCheck.data()?.name == "everyone") throw error(400);

    if(roleCheck.data()?.level as number >= locals.firestoreUser.level) throw(403);

    const team = locals.firestoreUser.team;
    const user = locals.user.uid;

    await db.runTransaction(async (transaction) => {
        const userDocs = (await transaction.get(db.collection('users').where('team', '==', team))).docs;

        let roles = await getRolesWithTransaction(team, transaction);

        console.log(roles);

        (() => {
            for(let i = 0; i < roles.length; i++) {
                if(roles[i].id == ref.id) {
                    roles.splice(i, 1);
                    return; 
                }
            }
        })();

        console.log(roles);

        let level = 0;
        for(let i = roles.length - 1; i >= 0; i--) {
            roles[i].level = level;
            level++;
        }

        console.log(roles);

        let userPermissions = new Map<string, { permissions: string[], level: number}>();

        for(let i = 0; i < userDocs.length; i++) {
            const userRoles = getRoles(userDocs[i].data()?.roles, roles);

            let newPermissions = new Array<string>();

            let level = 0;

            for(let j = 0; j < userRoles.length; j++) {
                if(userRoles[j].id != ref.id) {
                    for(let x = 0; x < userRoles[j].permissions.length; x++) {
                        if(!newPermissions.includes(userRoles[j].permissions[x])) {
                            newPermissions.push(userRoles[j].permissions[x]);
                        }
                    }

                    if(userRoles[j].level > level) {
                        level = userRoles[j].level;
                    }
                }
            }

            userPermissions.set(userDocs[i].id, {permissions: newPermissions, level});
        }

        transaction.delete(ref);

        for(let i = roles.length - 1; i >= 0; i--) {
            transaction.update(db.collection('teams').doc(team).collection('roles').doc(roles[i].id), {
                level: roles[i].level
            });
        }

        for(let i = 0; i < userDocs.length; i++) {
            if(userPermissions.get(userDocs[i].id) != undefined) {
                transaction.update(userDocs[i].ref, {
                    roles: FieldValue.arrayRemove(ref),
                    permissions: userPermissions.get(userDocs[i].id)?.permissions,
                    level: userPermissions.get(userDocs[i].id)?.level,
                })
            }
        }   

        firebaseAdmin.addLogWithTransaction("Deleted a role.", "group", user, transaction);
    })

    return json("success");
});

function getRoles(refs: DocumentReference[], roles: Role[]) {
    let specifiedRoles = new Array<Role>();

    for(let i = 0; i < refs.length; i++) {
        for(let j = 0; j < roles.length; j++) {
            if(roles[j].id == refs[i].id) {
                specifiedRoles.push(roles[j]);
            }
        }
    }

    return specifiedRoles;
}