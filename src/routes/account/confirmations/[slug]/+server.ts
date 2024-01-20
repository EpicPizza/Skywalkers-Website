import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, json, redirect } from "@sveltejs/kit";
import { z } from "zod";
import phone from "phone";

const Preference = z.union([
  z.literal("email"),
  z.literal("discord"),
  z.literal("phone"),
  z.literal("none"),
]);
const Number = z.string();

export async function POST({ request, locals, params }) {
  if (locals.user == undefined) throw error(403, "Sign In Required");

  if (locals.team == undefined || locals.firestoreUser == undefined)
    throw redirect(307, "/verify?needverify=true");

  let preference: z.infer<typeof Preference> = "none";
  let number: string = "";

  try {
    preference = Preference.parse(params.slug);

    if (preference == "phone") {
      let input = Number.parse(await request.text());

      let res = phone(input);

      if (res.isValid) {
        number = res.phoneNumber;
      } else {
        throw new Error("Invalid phone number");
      }
    }
  } catch (e) {
    console.log(e);

    throw error(400, "Invalid preference.");
  }

  const db = firebaseAdmin.getFirestore();

  const ref = db
    .collection("users")
    .doc(locals.user.uid)
    .collection("settings")
    .doc("confirmations");

  if (preference == "phone") {
    await ref.set({
      preference: preference,
      number: number,
    });
  } else {
    await ref.set({
      preference: preference,
      number: null,
    });
  }

  return json("Changed");
}
