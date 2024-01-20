import type { Teams } from "$lib/Firebase/firebase";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server";
import { error, json } from "@sveltejs/kit";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const UID = z.string().min(1).max(100);
const ROLE = z.string().min(1).max(100);

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team == undefined || locals.firestoreUser == undefined) { throw error(403, "AUTHORIZATION REQUIRED"); } 

    if(!locals.permissions.includes('MANAGE_ROLES')) throw error(403);

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

    const roleSnap = await db.collection('teams').doc(locals.team).collection('roles').doc(role).get();

    if(!roleSnap.exists) throw error(400, "Role not found.");

    if(roleSnap.data()?.level as number >= locals.level) throw error(403);

    const team = locals.team;
    const user = locals.user.uid;

    await db.runTransaction(async (transaction) => { //transaction may be unnecessary rn, but will add on more later.
        const doc = await transaction.get(userRef);

        if(doc.exists) {
            const teams = doc.data()?.teams as Teams;

            let rolesRef: DocumentReference[] = [];
            
            for(let i = 0; i < teams.length; i++) {
                if(teams[i].team == locals.team) {
                    rolesRef = teams[i].roles as unknown as DocumentReference[];
                }
            }

            const roles = await getSpecifiedRolesWithTransaction(rolesRef, transaction, team);


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

            for(let i = 0; i < teams.length; i++) {
                if(teams[i].team == locals.team) {
                    teams[i].permissions = permissions;
                    teams[i].level = level;
                   
                    for(let j = 0; j < teams[i].roles.length; j++) {
                        if(teams[i].roles[j].id == roleSnap.id) {
                            teams[i].roles.splice(j, 1);
                        }
                    }
                }
            }

            transaction.update(roleSnap.ref, {
                members: FieldValue.arrayRemove(userRef),
            })
    
            transaction.update(userRef, {
                teams: teams
            })

            firebaseAdmin.addLogWithTransaction("Removed a member from a role.", "group", user, transaction, team);
        }
    });

    return json("success");
})