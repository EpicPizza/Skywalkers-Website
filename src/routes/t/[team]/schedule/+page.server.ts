import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getRoles } from "$lib/Roles/role.server";
import { error, fail, redirect } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

const Create = z.object({
  title: z
    .string({
      invalid_type_error: "Invalid bruh.",
      required_error: "Title required",
    })
    .min(1, "Min one character title.")
    .max(100, "Max hundred character title."),
  description: z
    .string({
      invalid_type_error: "Invalid bruh.",
      required_error: "Description required.",
    })
    .min(1, "Min one character description.")
    .max(10000, "Max ten thousand character title."),
  length: z
    .number({
      invalid_type_error: "Length must be a number.",
      required_error: "Meeting length required.",
    })
    .min(1, "Min one hour length.")
    .max(4, "Max 4 hour length."),
  count: z
    .number({
      invalid_type_error: "Meeting count must be a number. ",
      required_error: "Meeting count required.",
    })
    .min(1, "Min one meeting.")
    .max(15, "Max fifthteen meetings."),
  member: z
    .number({
      invalid_type_error: "Member count must be a number. ",
      required_error: "Member count required.",
    })
    .min(3, "Min 3 members per meeting.")
    .max(10, "Max 10 members per meeting."),
  location: z
    .string({
      invalid_type_error: "Invalid bruh.",
      required_error: "Location required",
    })
    .min(0, "Min one character location.")
    .max(32, "Max 32 character location."),
  group: z
    .string({
      invalid_type_error: "Group role must be a string.",
      required_error: "Group role is required, idk why.",
    })
    .min(0, "Group role must be at least zero characters.")
    .max(100, "Group role must at most one hundred characters."),
  require: z
    .string({
      invalid_type_error: "Require role must be a string.",
      required_error: "Require role is required, idk why.",
    })
    .min(0, "Require role must be at least zero characters.")
    .max(100, "Require role must at most one hundred characters."),
  timezone: z.number().int(),
  starting: z.date(),
  ending: z.date(),
});

export async function load({ locals }) {
  if (locals.user == undefined) throw error(403, "Sign In Required");
  if (locals.team == undefined || locals.firestoreUser == undefined)
    throw redirect(307, "/verify?needverify=true");

  const roles = await getRoles(locals.team);

  const form = await superValidate(Create);

  form.data.starting = new Date();
  form.data.ending = new Date();
  form.data.count = 1;

  return { roles, form };
}

export const actions = {
  default: async function ({ request, locals }) {
    if (locals.user == undefined) throw error(403, "Sign In Required");
    if (locals.team == undefined || locals.firestoreUser == undefined)
      throw redirect(307, "/verify?needverify=true");

    const form = await superValidate(request, Create);

    if (!form.valid) {
      return fail(400, { form });
    }

    if (form.data.starting.valueOf() > form.data.ending.valueOf()) {
      return message(form, "Starting date must be before ending date.");
    }

    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 3000);
    });

    form.data.starting = new Date(
      form.data.starting.valueOf() - form.data.timezone * 1000 * 60,
    );
    form.data.ending = new Date(
      form.data.ending.valueOf() - form.data.timezone * 1000 * 60,
    );

    form.data.starting.setMilliseconds(0);
    form.data.starting.setSeconds(0);
    form.data.starting.setMinutes(0);
    form.data.starting.setHours(0);

    form.data.ending.setMilliseconds(0);
    form.data.ending.setSeconds(0);
    form.data.ending.setMinutes(0);
    form.data.ending.setHours(0);

    const days =
      (form.data.ending.valueOf() - form.data.starting.valueOf()) /
        (1000 * 60 * 60 * 24) +
      1;

    form.data.starting = new Date(
      form.data.starting.valueOf() + 60 * 60 * 1000 * 18,
    );

    const first = form.data.starting;
    const times = 14;

    const database = firebaseAdmin.getFirestore();

    const ref = database
      .collection("teams")
      .doc(locals.team)
      .collection("schedule");

    const doc = await ref.add({
      title: form.data.title,
      description: form.data.description,
      length: form.data.length,
      count: form.data.count,
      member: form.data.member,
      require: form.data.require ?? null,
      group: form.data.group ?? null,
      location: form.data.location ?? null,
      first: first,
      days: days,
      times: times,
      signups: [],
    });

    throw redirect(303, "/t/" + locals.team + "/schedule/" + doc.id);
  },
};
