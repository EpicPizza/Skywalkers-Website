import type { Teams } from "$lib/Firebase/firebase";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Role } from "$lib/Roles/role";
import { getRolesWithTransaction, getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server";
import { error, json } from "@sveltejs/kit";
import type { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { runTransaction } from "firebase/firestore";
import { z } from "zod";

const ROLE = z.string().min(1).max(100);

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team == undefined || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); } 

    if(!locals.permissions.includes('MANAGE_ROLES')) throw error(403);

    const req = await request.json();

    const role = ROLE.parse(req.role);

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.team).collection('roles').doc(role);

    let roleCheck = await ref.get();

    if(!roleCheck.exists) throw error(400);

    if(roleCheck.data()?.name == "everyone") throw error(400);

    if(roleCheck.data()?.level as number >= locals.level) throw(403);

    const team = locals.team;
    const user = locals.user.uid;

    await db.runTransaction(async (transaction) => {
        const userDocs = (await transaction.get(db.collection('users').where('team', 'array-contains', team))).docs;

        let roles = await getRolesWithTransaction(team, transaction);

        (() => {
            for(let i = 0; i < roles.length; i++) {
                if(roles[i].id == ref.id) {
                    roles.splice(i, 1);
                    return; 
                }
            }
        })();

        let level = 0;
        for(let i = roles.length - 1; i >= 0; i--) {
            roles[i].level = level;
            level++;
        }

        let userPermissions = new Map<string, Teams>();

        for(let i = 0; i < userDocs.length; i++) {
            const teams = userDocs[i].data()?.teams as Teams;

            let rolesRef: DocumentReference[] = [];
            
            for(let i = 0; i < teams.length; i++) {
                if(teams[i].team == locals.team) {
                    rolesRef = teams[i].roles as unknown as DocumentReference[];
                }
            }

            const userRoles = getRoles(rolesRef, roles);

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

            for(let x = 0; x < teams.length; x++) {
                if(teams[x].team == locals.team) {
                    teams[x].permissions = newPermissions;
                    teams[x].level = level;
                   
                    for(let y = 0; y < teams[x].roles.length; y++) {
                        if(teams[x].roles[y].id == ref.id) {
                            teams[x].roles.splice(y, 1);
                        }
                    }
                }
            }

            userPermissions.set(userDocs[i].id, teams);
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
                    teams: userPermissions.get(userDocs[i].id),
                })
            }
        }   

        firebaseAdmin.addLogWithTransaction("Deleted a role.", "group", user, transaction, team);
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