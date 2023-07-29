import type { Code } from "$lib/Codes/codes.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

const MainRole = z.union([
    z.literal('mentor'),
    z.literal('parent'),
    z.literal('student')
], { required_error: "A role must be choosen. ", invalid_type_error: "Role must be mentor, parent, or string."})


const GenerateCodes = z.object({
    role: MainRole,
    count: z.number({ required_error: "How many cdes to generate must be specified.", invalid_type_error: "Number of codes to generate must be a number."}).int({ message: "Number of codes to generate must not include decimals."}).min(1, { message: "Number of codes to generate must be positive."}).max(50, { message: "Number of codes to generate must not exceed 50."}),
    emails: z.string({ invalid_type_error: "Emails to restrict to must be a string."}).optional(),
})

const EditCode = z.object({
    role: MainRole,
    email: z.string().email().optional(),
    code: z.string().length(6).regex(/[1-9]*/),
})

export async function load({ locals }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

    if(!locals.firestoreUser.permissions.includes('MANAGE_CODES')) throw error(403, "Forbidden");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.firestoreUser.team);

    const doc = (await ref.get()).data();

    if(doc == undefined) throw error(500);

    const codes = new Map(Object.entries(doc));

    const generateForm = await superValidate(GenerateCodes);

    const editForm = await superValidate(EditCode);
    
    generateForm.data.count = 1;
    generateForm.data.role = "student";

    console.log(codes);

    return {
        codes: codes as Map<string, Code>,
        forms: {
            generate: generateForm,
            edit: editForm,
        },
    }
}

export const actions = {
    generate: async ({ request, locals }) => {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.firestoreUser == undefined) throw error(403);

        if(!locals.firestoreUser.permissions.includes('MANAGE_CODES')) throw error(403, "Forbidden");

        const form = await superValidate(request, GenerateCodes);

        if(!form.valid) {
            return fail(400, { form });
        }

        const emails = parseEmails(form.data.emails);

        if(emails == undefined && form.data.emails != undefined ) {
            return message(form, "Invalid emails.");
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team);

        const doc = (await ref.get()).data();

        if(doc == undefined) throw error(500);

        const oldCodes = new Map<string, Code>(Object.entries(doc));

        let codes = new Map<string, Code>();

        if(emails != undefined && form.data.emails != undefined) {
            console.log(oldCodes);
            console.log(emails);
            
            try {
                oldCodes.forEach((code) => {
                    if(emails.includes(code.access)) {
                        throw "exists " + code.access;
                    }
                })
            } catch(e) {
                if(typeof e == 'string' && e.startsWith("exists") && e.length > 7) {
                    return message(form, "Existing code with email " + e.substring(7, e.length) + " found.");
                } else {
                    throw e;
                }
            }

            const { users } = await firebaseAdmin.getAuth().getUsers(emails.reduce((k,v) => [... k, {'email': v}] as any, []));

            for(let i = 0; i < users.length; i++) {
                const userDoc = await db.collection('users').doc(users[i].uid).get();

                let data = userDoc.data();

                if(data != undefined && data.team == locals.firestoreUser.team) {
                    return message(form, "Existing user with email " + users[i].email + " found.");
                }   
            }

            for(let i = 0; i < emails.length; i++) {
                const code = getNewCode(oldCodes);

                codes.set(code, {role: form.data.role, id: crypto.randomUUID(), access: emails[i]});
            }

            await ref.update(Object.fromEntries(codes));
    
            return message(form, "Generated Codes");
        } else {

            for(let i = 0; i < form.data.count; i++) {
                const code = getNewCode(oldCodes);
    
                codes.set(code, {role: form.data.role, id: crypto.randomUUID(), access: "anyone"});
            }
    
            await ref.update(Object.fromEntries(codes));
    
            return message(form, "Generated Codes");
        }
    },
    edit: async ({ request, locals }) => {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.firestoreUser == undefined) throw error(403);

        if(!locals.firestoreUser.permissions.includes('MANAGE_CODES')) throw error(403, "Forbidden");

        const form = await superValidate(request, EditCode);

        if(!form.valid) {
            return fail(400, { form });
        }

        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('teams').doc(locals.firestoreUser.team);

        const doc = (await ref.get()).data();

        if(doc == undefined) throw error(500);

        const oldCodes = new Map<string, Code>(Object.entries(doc));

        if(form.data.email == undefined) {
            if(oldCodes.get(form.data.code) == undefined) return message(form, "Code not found.");

            await ref.update({
                [form.data.code + ".access"]: "anyone",
                [form.data.code + ".role"]: form.data.role, 
            })
        } else {
            try {
                oldCodes.forEach((code) => {
                    if(code.access == form.data.email) {
                        throw "exists " + code.access;
                    }
                })
            } catch(e) {
                if(typeof e == 'string' && e.startsWith("exists") && e.length > 7) {
                    return message(form, "Existing code with email " + e.substring(7, e.length) + " found.");
                } else {
                    throw e;
                }
            }

            let user;
            try {
                user = await firebaseAdmin.getAuth().getUserByEmail(form.data.email);
            } catch(e: any) {
                if(!e.message.includes("no user record")) {
                    console.log(e);
                }
            }

            if(user != undefined) {
                const userDoc = await db.collection('users').doc(user.uid).get();

                let data = userDoc.data();

                if(data != undefined && data.team == locals.firestoreUser.team) {
                    return message(form, "Existing user with email " + user.email + " found.");
                }   
            }

            await ref.update({
                [form.data.code + ".access"]: form.data.email,
                [form.data.code + ".role"]: form.data.role, 
            })
        }

        return message(form, "Edited Code");
    }
}

const Email = z.string().email();

const parseEmails = (input: string | undefined) => {
    if(input == undefined) return undefined;

    let emails = new Array<string>();

    emails = input.split(",");

    if(emails.length == 1) emails = input.split("\n");

    if(emails.length == 1) emails = input.split("\t");

    for(let i = 0; i < emails.length; i++) {
        emails[i] = emails[i].trim();
        try {
            emails[i] == Email.parse(emails[i]);
        } catch {

            console.log(emails);
            return undefined;
        }
    }

    return emails;
}

const getNewCode = (codes: Map<string, Code>): string => {
    const code = getRandomCode();

    if(codes.get(code) != undefined) {
        return getNewCode(codes);
    } else {
        return code;
    }
}

const getRandomNumber = () => {
    return crypto.getRandomValues(new Uint32Array(1))[0]/2**32;
}

const getRandomCode = () => {
    let code = "";

    for(let i = 0; i < 6; i++) {
        code += Math.floor(getRandomNumber() * 9 + 1);
    }

    return code;
}