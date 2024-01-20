import { RoleForm } from "$lib/Roles/role";
import { error, redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";

export async function load({ locals }) {
  if (locals.user == undefined) throw error(403, "Sign In Required");
  if (locals.team == undefined || locals.firestoreUser == undefined)
    throw redirect(307, "/verify?needverify=true");
}
