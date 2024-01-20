import type { SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { EditProfile, QuarantineMember } from "$lib/Members/members";
import { getSpecifiedRoles } from "$lib/Roles/role.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export async function load({ locals }) {
  if (locals.user == undefined) throw error(401, "Sign In Required");
  if (locals.firestoreUser == undefined) throw redirect(307, "/verify");

  const db = firebaseAdmin.getFirestore();

  const docs = await db
    .collection("users")
    .where("team", "array-contains", locals.team)
    .get();

  let users = new Array<SecondaryUser>();

  for (let i = 0; i < docs.docs.length; i++) {
    for (let j = 0; j < docs.docs[i].data().teams; j++) {
      docs.docs[i].data().teams[j].roles = await getSpecifiedRoles(
        docs.docs[i].data().teams[j].roles as DocumentReference[],
      );
    }

    users.push({
      photoURL: docs.docs[i].data().photoURL,
      displayName: docs.docs[i].data().displayName,
      pronouns: docs.docs[i].data().pronouns,
      id: docs.docs[i].id,
      teams: [],
    });
  }

  const kickForm = await superValidate(QuarantineMember);

  return {
    members: users,
    forms: {
      kickForm: kickForm,
    },
  };
}
