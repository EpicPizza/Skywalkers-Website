import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, json } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const Codes = z
  .string()
  .length(6)
  .regex(/^[0-9]*$/)
  .array()
  .min(1);

export async function POST({ request, locals }) {
  if (locals.user == undefined) throw error(403, "Sign In Required");
  if (locals.firestoreUser == undefined || locals.team == undefined)
    throw error(403);

  if (!locals.permissions.includes("MANAGE_CODES"))
    throw error(403, "Forbidden");

  const req = await request.json();

  if (!("codes" in req)) throw error(400);

  const codes = Codes.parse(req.codes);

  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("teams").doc(locals.team);

  const user = locals.user.uid;

  let team = locals.team;

  await db.runTransaction(async (t) => {
    t.update(
      ref,
      codes.reduce((a, v) => ({ ...a, [v]: FieldValue.delete() }), {}),
    );

    firebaseAdmin.addLogWithTransaction(
      "Deleted code(s).",
      "vpn_key",
      user,
      t,
      team,
    );
  });

  return json("deleted codes");
}
