import { error, json } from "@sveltejs/kit";
import { z } from "zod";
import type { Role } from '../../../../../../lib/Roles/role';
import { getRoles, getRolesWithTransaction } from "../../../../../../lib/Roles/role.server";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import type { FirestoreUser, Teams } from "$lib/Firebase/firebase";

const ResortRequest = z.object({
    to: z.number().int().nonnegative(),
    from: z.number().int().nonnegative(),
})

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team == undefined || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); }
    
    if(!locals.permissions.includes('MANAGE_ROLES')) throw error(403);

    let parsedRequest;
    try {
        parsedRequest = ResortRequest.parse(await request.json());
    } catch(e) {
        throw error(400);
    }
    const { from, to } = parsedRequest;

    const db = firebaseAdmin.getFirestore();

    const team = locals.team;
    const user = locals.user.uid;

    const requestUserLevel = locals.level;

    await (async () => {
        const roles = await getRoles(team);

        if(from === to || to === from + 1) { //dont resort if going to same position
            throw error(400);
        }

        if(from > roles.length - 1 || to > roles.length - 1) {
            throw error(400);
        }

        if(roles.length - from - 1 >= requestUserLevel || roles.length - to - 1 >= requestUserLevel) {
            throw error(403);
        }
    })();

    await db.runTransaction(async transaction => {
        const roles = await getRolesWithTransaction(team, transaction);
    
        let fromRole = roles[from]; // gets role that is being moved
    
        let movedRole = structuredClone(fromRole); // to differ from new/old role when role that is being moved gets inserted at new index
        (movedRole as any).moved = true;
    
        roles.splice(to, 0, movedRole); //inserts role being moved
    
        for(let i = 0; i < roles.length; i++) { //removes old moved role
            if(roles[i].id === fromRole.id && (roles[i] as any).moved != true) {
                roles.splice(i, 1);
            }
        }
    
        for(let i = 0; i < roles.length; i++) { //resets moved role
            if((roles[i] as any).moved === true) {
                (roles[i] as any).moved = false;
            }
        }

        const users = await transaction.get(db.collection('users').where('team', 'array-contains', team));

        let level = 0;
        for(let i = roles.length - 1; i >= 0; i--) {
            roles[i].level = level;
            transaction.update(db.collection('teams').doc(team).collection('roles').doc(roles[i].id), {
                level: roles[i].level
            });
            level++;
        }

        for(let i = 0; i < users.docs.length; i++) {
            let userlevel = 0;

            const teams = users.docs[i].data()?.teams as Teams;

            let rolesRef: DocumentReference[] = [];
            
            for(let i = 0; i < teams.length; i++) {
                if(teams[i].team == locals.team) {
                    rolesRef = teams[i].roles as unknown as DocumentReference[];
                }
            }

            for(let j = 0; j < rolesRef.length; j++) {
                let role = getRole(roles, rolesRef[j].id);

                if(role != undefined) {
                    if(role.level > userlevel) {
                        userlevel = role.level;
                    }
                }
            }

            const member = users.docs[i].data() as FirestoreUser; //for my sanity

            for(let i = 0; i < member.teams.length; i++) {
                if(member.teams[i].team == locals.team) {
                    member.teams[i].level = userlevel;
                }
            }

            transaction.update(users.docs[i].ref, member as any);
        }

        firebaseAdmin.addLogWithTransaction("Changed role order.", "group", user, transaction, team);
    })  

    return json(true);
});

function getRole(roles: Role[], id:string) {
    for(let i = 0; i < roles.length; i++) {
        if(roles[i].id == id) {
            return roles[i];
        }
    }
}