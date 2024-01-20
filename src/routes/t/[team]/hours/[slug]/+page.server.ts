import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Hours, Indicator } from "$lib/Hours/hours.server";
import { getMember } from "$lib/Members/manage.server";
import { error, fail, redirect } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import { message, superValidate } from "sveltekit-superforms/server";
import colors from "tailwindcss/colors.js";
import { z } from "zod";

const AddHours = z.object({
  reason: z
    .string()
    .max(100, { message: "Reason can not be more than 100 characters." }),
  hours: z
    .number()
    .min(-12, "Number of hours has to be more than -12.")
    .max(12, "Number of hours cannot be more than 12.")
    .multipleOf(0.25, "Must be a multiple of 0.25.")
    .refine((number) => {
      return number != 0;
    }, "Zero not allowed."),
});

let addIndicator: Indicator = {
  color: colors.green["500"],
  icon: "add_circle",
};
let removeIndicator: Indicator = {
  color: colors.red["500"],
  icon: "remove_circle",
};

export async function load({ locals, params, url, depends }) {
  if (locals.user == undefined) throw error(401, "Sign In Required");
  if (locals.firestoreUser == undefined || locals.team == undefined)
    throw redirect(307, "/verify");

  depends("hours:" + locals.user.uid);

  const db = firebaseAdmin.getFirestore();

  const user = await getMember(params.slug, locals.team, true);

  //if(!user || user.team != locals.firestoreUser.team) throw error(400, "User not found.");

  const ref = db
    .collection("teams")
    .doc(locals.team)
    .collection("hours")
    .doc(params.slug);

  const doc = await ref.get();

  if (!doc.exists) throw error(400, "Hours not found.");

  const data = doc.data() as Hours;

  if (!data) throw error(400, "Hours not found.");

  if (data.deleted) throw error(400, "Hours deleted.");

  const form = await superValidate(AddHours);

  type Hours = {
    deleted: boolean;
    entries: {
      id: string;
      latest: number;
      total: number;
      history: {
        date: number;
        hours: number;
        id: string;
        indicator: { color: string; icon: string };
        link: string;
        reason: string;
      }[];
    }[];
    total: number;
  };

  return {
    hours: data as Hours,
    forms: { add: form },
    id: params.slug,
    name: user?.displayName ?? "Deleted User",
  };
}

export const actions = {
  default: async function ({ locals, request, params }) {
    if (locals.user == undefined) throw error(401, "Sign In Required");
    if (locals.firestoreUser == undefined || locals.team == undefined)
      throw redirect(307, "/verify");

    const form = await superValidate(request, AddHours);

    if (!form.valid) {
      return fail(400, { form });
    }

    const db = firebaseAdmin.getFirestore();

    const ref = db
      .collection("teams")
      .doc(locals.team)
      .collection("hours")
      .doc(params.slug);

    const doc = await ref.get();

    if (!doc.exists) throw error(400, "Hours not found.");

    const data = doc.data() as Hours;

    if (!data) throw error(400, "Hours not found.");

    ref.update({
      total: data.total + form.data.hours,
      entries: FieldValue.arrayUnion({
        total: form.data.hours,
        id: crypto.randomUUID(),
        latest: 0,
        history: [
          {
            hours: form.data.hours,
            reason: form.data.reason == "" ? null : form.data.reason,
            id: locals.user.uid,
            link: null,
            indicator: form.data.hours < 0 ? removeIndicator : addIndicator,
            date: new Date().valueOf(),
          },
        ],
      }),
    });

    return message(form, "Success");
  },
};
