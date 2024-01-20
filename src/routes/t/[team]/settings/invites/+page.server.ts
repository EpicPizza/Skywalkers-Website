import type { Code } from "$lib/Codes/codes.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import mail, { type MailDataRequired } from "@sendgrid/mail";
import {
  SENDGRID,
  SENDGRIDFROM,
  SENDGRIDNAME,
  SENDGRIDTEMPLATE,
  SENDGRIDREPLYTO,
  DOMAIN,
  SENDGRIDINVITE,
} from "$env/static/private";

const MainRole = z.union(
  [z.literal("mentor"), z.literal("parent"), z.literal("student")],
  {
    required_error: "A role must be choosen. ",
    invalid_type_error: "Role must be mentor, parent, or string.",
  },
);

const GenerateCodes = z.object({
  role: MainRole,
  emails: z.string({ invalid_type_error: "Enter an email." }),
});

export async function load({ locals }) {
  if (locals.user == undefined) throw error(401, "Sign In Required");
  if (locals.firestoreUser == undefined || locals.team == undefined)
    throw redirect(307, "/verify");

  if (!locals.permissions.includes("MANAGE_CODES"))
    throw error(403, "Forbidden");

  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("teams").doc(locals.team);

  const doc = (await ref.get()).data();

  if (doc == undefined) throw error(500);

  const codes = new Map(Object.entries(doc));

  const generateForm = await superValidate(GenerateCodes);

  generateForm.data.role = "student";

  return {
    codes: codes as Map<string, Code>,
    forms: {
      generate: generateForm,
    },
  };
}

export const actions = {
  generate: async ({ request, locals }) => {
    if (locals.user == undefined) throw error(403, "Sign In Required");
    if (locals.firestoreUser == undefined || locals.team == undefined)
      throw error(403);

    if (!locals.permissions.includes("MANAGE_CODES"))
      throw error(403, "Forbidden");

    const form = await superValidate(request, GenerateCodes);

    if (!form.valid) {
      return fail(400, { form });
    }

    const emails = parseEmails(form.data.emails);

    if (emails == undefined && form.data.emails != undefined) {
      return message(form, "Invalid emails.");
    }

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection("teams").doc(locals.team);

    if ((await ref.get()).exists == false) throw error(500);

    const team = locals.team;
    const uid = locals.user.uid;

    const validateResult = await (async () => {
      const doc = (await ref.get()).data();

      if (doc == undefined) throw error(500);

      const oldCodes = new Map<string, Code>(Object.entries(doc));

      let codes = new Map<string, Code>();

      if (emails != undefined && form.data.emails != undefined) {
        try {
          oldCodes.forEach((code) => {
            if (emails.includes(code.access)) {
              throw "exists " + code.access;
            }
          });
        } catch (e) {
          if (typeof e == "string" && e.startsWith("exists") && e.length > 7) {
            return message(
              form,
              "Existing code with email " +
                e.substring(7, e.length) +
                " found.",
            );
          } else {
            throw e;
          }
        }

        const { users } = await firebaseAdmin
          .getAuth()
          .getUsers(emails.reduce((k, v) => [...k, { email: v }] as any, []));

        for (let i = 0; i < users.length; i++) {
          const userDoc = await db.collection("users").doc(users[i].uid).get();

          let data = userDoc.data();

          if (data != undefined && data.team == team) {
            return message(
              form,
              "Existing user with email " + users[i].email + " found.",
            );
          }
        }
      }
    })();

    if (validateResult != undefined) return validateResult;

    const sending = await db.runTransaction(async (t) => {
      const doc = (await t.get(ref)).data();

      if (doc == undefined) throw error(500);

      const oldCodes = new Map<string, Code>(Object.entries(doc));

      let codes = new Map<string, Code>();

      if (!(emails != undefined && form.data.emails != undefined)) return;

      try {
        oldCodes.forEach((code) => {
          if (emails.includes(code.access)) {
            throw "exists " + code.access;
          }
        });
      } catch (e) {
        if (typeof e == "string" && e.startsWith("exists") && e.length > 7) {
          //return message(form, "Existing code with email " + e.substring(7, e.length) + " found.");

          return;
        } else {
          throw e;
        }
      }

      const { users } = await firebaseAdmin
        .getAuth()
        .getUsers(emails.reduce((k, v) => [...k, { email: v }] as any, []));

      for (let i = 0; i < users.length; i++) {
        const userDoc = await t.get(db.collection("users").doc(users[i].uid));

        let data = userDoc.data();

        if (data != undefined && data.team == team) {
          //return message(form, "Existing user with email " + users[i].email + " found.");

          return;
        }
      }

      const toSend = new Array<{ email: string; code: string }>();

      for (let i = 0; i < emails.length; i++) {
        const code = getNewCode(oldCodes);

        const id = crypto.randomUUID();

        toSend.push({ email: emails[i], code: id });

        codes.set(code, { role: form.data.role, id: id, access: emails[i] });
      }

      t.update(ref, Object.fromEntries(codes));

      firebaseAdmin.addLogWithTransaction(
        "Generated code(s).",
        "vpn_key",
        uid,
        t,
        team,
      );

      return toSend;
    });

    mail.setApiKey(SENDGRID);

    if (sending != undefined) {
      const msg = {
        from: {
          email: SENDGRIDFROM,
          name: SENDGRIDNAME,
        },
        templateId: SENDGRIDINVITE,
        replyTo: SENDGRIDREPLYTO,
        subject:
          "Invitation to " + locals.teamInfo.get(team)?.name + " Team Website",
        dynamicTemplateData: {
          team: locals.teamInfo.get(team)?.name,
          subject:
            "Invitation to " +
            locals.teamInfo.get(team)?.name +
            " Team Website",
        },
        personalizations: Array.from(sending, (sending) => {
          return {
            to: sending.email,
            dynamicTemplateData: {
              link: DOMAIN + "/t/" + team + "/verify/" + sending.code,
            },
          };
        }),
      } satisfies MailDataRequired;

      mail.send(msg);
    }

    return message(form, "Generated Codes");
  },
};

const Email = z.string().email();

const parseEmails = (input: string | undefined) => {
  if (input == undefined) return undefined;

  let emails = new Array<string>();

  emails = input.split(",");

  if (emails.length == 1) emails = input.split("\n");

  if (emails.length == 1) emails = input.split("\t");

  for (let i = 0; i < emails.length; i++) {
    emails[i] = emails[i].trim();
    try {
      emails[i] == Email.parse(emails[i]);
    } catch {
      return undefined;
    }
  }

  return emails;
};

const getNewCode = (codes: Map<string, Code>): string => {
  const code = getRandomCode();

  if (codes.get(code) != undefined) {
    return getNewCode(codes);
  } else {
    return code;
  }
};

const getRandomNumber = () => {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
};

const getRandomCode = () => {
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += Math.floor(getRandomNumber() * 9 + 1);
  }

  return code;
};
