import { FIREBASE_OWNER, FIREBASE_OWNER_EMAIL } from "$env/static/private";
import { firebaseAdmin, getPhotoURL } from "$lib/Firebase/firebase.server";
import { error, fail } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

const CreateTeam = z.object({
    uid: z.string().min(1).max(100),
    id: z.string().length(6),
    role: z.string().min(1).max(100)
})

export async function load({ locals }) {
    if(locals.user == undefined || locals.user.uid != FIREBASE_OWNER || locals.user.email != FIREBASE_OWNER_EMAIL) throw error(401, "Forbidden");

    const form = await superValidate(CreateTeam);

    return { form };
}

export const actions = {
    default: async ({ locals, request }) => {
        if(locals.user == undefined || locals.user.uid != FIREBASE_OWNER || locals.user.email != FIREBASE_OWNER_EMAIL) throw error(401, "Forbidden");

        const form = await superValidate(request, CreateTeam);

        if(!form.valid) {
            return fail(400, { form })
        }

        const db = firebaseAdmin.getFirestore();

        const firestore = (await db.collection('users').doc(form.data.uid).get()).data();

        if(firestore == undefined) {
            const user = await firebaseAdmin.getAuth().getUser(form.data.uid);

            let photoURL = await getPhotoURL(user.photoURL as string, user.uid);

            await db.collection('teams').doc(form.data.id).create({});

            const roleID = crypto.randomUUID();

            await db.collection('teams').doc(form.data.id).collection('roles').doc(roleID).set({
                color: '#fff200',
                level: 1,
                members: [ db.collection('users').doc(form.data.uid) ],
                name: 'owner',
                permissions: ["MANAGE_CODES","MODERATE_MEETINGS","MANAGE_ROLES","KICK_MEMBERS","EDIT_PROFILE","MODERATE_PROFILES","VIEW_MEETINGS","EDIT_MEETINGS","CREATE_MEETINGS","DELETE_MEETINGS","LEAVE_SIGNUP","ADD_SYNOPSES","EDIT_SYNOPSES","MODERATE_SYNOPSES","VIEW_LOGS"],
            })

            await db.collection('teams').doc(form.data.id).collection('roles').add({
                color: '#000000',
                level: 0,
                members: [],
                name: 'everyone',
                permissions: [],
            })

            await db.collection('users').doc(form.data.uid).set({
                displayName: locals.user.displayName,
                photoURL: photoURL,
                pronouns: "",
                team: [form.data.id],
                teams: [{
                    role: form.data.role,
                    permissions: ["MANAGE_CODES","MODERATE_MEETINGS","MANAGE_ROLES","KICK_MEMBERS","EDIT_PROFILE","MODERATE_PROFILES","VIEW_MEETINGS","EDIT_MEETINGS","CREATE_MEETINGS","DELETE_MEETINGS","LEAVE_SIGNUP","ADD_SYNOPSES","EDIT_SYNOPSES","MODERATE_SYNOPSES","VIEW_LOGS"],
                    level: 1,
                    roles: [ db.collection('teams').doc(form.data.id).collection('roles').doc(roleID) ],
                    team: form.data.id,
                }]
            })

            await db.collection('teams').doc(form.data.id).collection('hours').doc(form.data.uid).set({
                total: 0,
                entries: [],
                deleted: false,
                history: [],
            })

            await firebaseAdmin.addLog("Joined the team.", "person", form.data.uid);
        } else {
            await db.collection('teams').doc(form.data.id).create({});

            const roleID = crypto.randomUUID();

            await db.collection('teams').doc(form.data.id).collection('roles').doc(roleID).set({
                color: '#fff200',
                level: 1,
                members: [ db.collection('users').doc(form.data.uid) ],
                name: 'owner',
                permissions: ["MANAGE_CODES","MODERATE_MEETINGS","MANAGE_ROLES","KICK_MEMBERS","EDIT_PROFILE","MODERATE_PROFILES","VIEW_MEETINGS","EDIT_MEETINGS","CREATE_MEETINGS","DELETE_MEETINGS","LEAVE_SIGNUP","ADD_SYNOPSES","EDIT_SYNOPSES","MODERATE_SYNOPSES","VIEW_LOGS"],
            })

            await db.collection('teams').doc(form.data.id).collection('roles').add({
                color: '#000000',
                level: 0,
                members: [],
                name: 'everyone',
                permissions: [],
            })

            await db.collection('users').doc(form.data.uid).update({
                team: FieldValue.arrayUnion(form.data.id),
                teams: FieldValue.arrayUnion({
                    role: form.data.role,
                    permissions: ["MANAGE_CODES","MODERATE_MEETINGS","MANAGE_ROLES","KICK_MEMBERS","EDIT_PROFILE","MODERATE_PROFILES","VIEW_MEETINGS","EDIT_MEETINGS","CREATE_MEETINGS","DELETE_MEETINGS","LEAVE_SIGNUP","ADD_SYNOPSES","EDIT_SYNOPSES","MODERATE_SYNOPSES","VIEW_LOGS"],
                    level: 1,
                    roles: [ db.collection('teams').doc(form.data.id).collection('roles').doc(roleID) ],
                    team: form.data.id,
                })
            });

            await db.collection('teams').doc(form.data.id).collection('hours').doc(form.data.uid).set({
                total: 0,
                entries: [],
                deleted: false,
                history: [],
            })

            await firebaseAdmin.addLog("Joined the team.", "person", form.data.uid);
        }
    }
}