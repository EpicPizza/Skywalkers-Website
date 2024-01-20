import { PRIVATE_KEY } from "$env/static/private";
import { getRoles } from "$lib/Discord/discord.server.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, json } from "@sveltejs/kit";

export const POST = async ({ locals }) => {
  if (
    locals.user == undefined ||
    locals.team == undefined ||
    locals.firestoreUser == undefined
  ) {
    throw error(403, "AUTHORIZATION REQUIRED");
  }

  return json(await getRoles(locals.team));
};
