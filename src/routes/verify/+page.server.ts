import { fail, redirect } from "@sveltejs/kit";
import { late, z } from "zod";
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import { navigating } from '$app/stores'
import safeCompare from "safe-compare";

const StepOne = z.object({
    member_id: z.string({ required_error: "Personal code is empty", invalid_type_error: "Personal code must be a number" }).length(6, { message : "Personal code must be 6 numbers long" }).regex(/^[0-9]*$/, { message: "Personal code must be a number."}),
    team_id: z.string({ required_error: "Team code is empty", invalid_type_error: "Personal code must be a number" }).length(6, { message : "Team code must be 6 numbers long" }).regex(/^[0-9]*$/, { message: "Team code must be a number."}),
});

export async function load(event) {
    if(event.locals.user == undefined) {
        throw redirect(307, "/?signin=true");
    }

    if(event.locals.user.customClaims != undefined && event.locals.user.customClaims['team'] == true) {
        throw redirect(307, "/?alrverify=true");
    }

    const db = firebaseAdmin.getFirestore();

    const users = await db.collection('users').listDocuments();

    let found: false | string = false;
    for(let i = 0; i < users.length; i++) {
        if(safeCompare(event.locals.user.uid, users[i].id)) {
            let data = (await users[i].get()).data();
            console.log("Found", data);
            if(data != undefined) {
                found = data.verify;
            };
        }
    }

    const form = await superValidate(event, StepOne);

    if(found != false) {
        form.data.member_id = found.split("-")[0];
        form.data.team_id = found.split("-")[1];
    }

    return {
        verify: {
            forms: {
                one: form,
            },
            errors: {
                invalid: event.url.searchParams.get("invalid") === 'true' ? true : false,
                redirected: event.url.searchParams.get("needverify") === 'true' ? true : false,
            }
        }
    }
}

export const actions = {
    default: async ({ request, locals }) => {
        if(locals.user == undefined) { throw redirect(307, "/?signin=true"); }

        if(locals.user.customClaims != undefined && locals.user.customClaims['team'] == true) {
            throw redirect(307, "/?alrverify=true");
        }

        const form = await superValidate(request, StepOne);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const teams = await db.collection('teams').listDocuments();

        let found = false;
        for(let i = 0; i < teams.length; i++) {
            if(crypto.timingSafeEqual(Buffer.from(teams[i].id), Buffer.from(form.data.team_id.toString()))) {
                const members = (await db.collection('teams').doc(form.data.team_id.toString()).get()).data() as Object;

                const codes = Object.keys(members);

                for(let j = 0; j < codes.length; j++) {
                    if(crypto.timingSafeEqual(Buffer.from(codes[j]), Buffer.from(form.data.member_id.toString()))) {
                        found = true;
                        console.log("Found", form.data.member_id.toString() + "-" + form.data.team_id.toString())

                        await db.collection('users').doc(locals.user.uid).set({
                            verify: form.data.member_id + "-" + form.data.team_id,
                            photoURL: locals.user.photoURL,
                            displayName: locals.user.displayName,
                            email: locals.user.email,
                        })

                        throw redirect(307, "/verify/confirm");
                    }
                }
            } else {
                const members = (await db.collection('teams').doc(teams[i].id).get()).data() as Object;

                const codes = Object.keys(members);

                for(let j = 0; j < codes.length; j++) {
                    crypto.timingSafeEqual(Buffer.from(codes[j]), Buffer.from(form.data.member_id.toString()));
                }
            }
        }

        if(found == false) {
            return message(form, 'Invalid code(s).', {
                status: 404,
            });
        } else {
            return { form };
        }
    }
}