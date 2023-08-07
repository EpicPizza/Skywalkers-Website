import { getRoles } from "$lib/Discord/discord.server.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Role } from "$lib/Roles/role.js";
import { getRolesWithTransaction, getSpecifiedRoles, getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server.js";
import { error, json } from "@sveltejs/kit";
import { DocumentReference, FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const ID = z.string().min(1).max(100).or(z.null());
const ROLE = z.string().min(1).max(100);

export const POST = (async ({ locals, request }) => {
    if(locals.user == undefined || locals.team === false || locals.firestoreUser == undefined) { throw error(401, "AUTHORIZATION REQUIRED"); } 

    if(!locals.firestoreUser.permissions.includes('MANAGE_ROLES')) throw error(403);

    const req = await request.json();

    console.log(req);

    const id = ID.parse(req.id);
    const role = ROLE.parse(req.role);

    const db = firebaseAdmin.getFirestore();

    const roleRef = db.collection('teams').doc(locals.firestoreUser.team).collection('roles').doc(role);

    if(!(await roleRef.get()).exists) throw error(401, "Website role not found.");

    const roles = await getRoles();

    let found = false;
    for(let i = 0; i < roles.length; i++) {
        if(roles[i].id == id) {
            found = true;
        }
    }

    if(found == false && id != null) throw error(401, "Discord role not found.")

    await db.runTransaction( async (transaction) => {
        transaction.update(roleRef, {
            connectTo: id,
        })
    })

    return json({ success: true });
});