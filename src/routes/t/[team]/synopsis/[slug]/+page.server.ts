import type { FirestoreUser, SecondaryUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getDefault } from "$lib/Meetings/helpers";
import {
  type FetchedMeeting,
  getFetchedMeeting,
} from "$lib/Meetings/helpers.server";
import { getMember } from "$lib/Members/manage.server.js";
import { getSpecifiedRoles } from "$lib/Roles/role.server.js";
import { error, redirect } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";

export async function load({ params, locals, url }) {
  if (locals.user == undefined) throw error(403, "Sign In Required");

  if (locals.team == undefined || locals.firestoreUser == undefined)
    throw redirect(307, "/verify?needverify=true");

  if (!locals.permissions.includes("VIEW_MEETINGS"))
    throw error(403, "Unauthorized.");

  let meeting: FetchedMeeting | false = false;

  try {
    meeting = await getFetchedMeeting(
      params.slug,
      locals.user.uid,
      locals.team,
    );
  } catch (e: any) {
    if ("type" in e && e.type == "display") {
      throw error(404, e.message);
    } else {
      console.log(e);
    }
  }

  if (!meeting)
    throw error(404, "Huh, for some reason the meeting is not here.");

  const synopsisRef = firebaseAdmin
    .getFirestore()
    .collection("teams")
    .doc(locals.team)
    .collection("synopsis")
    .doc(params.slug);

  const synopsis = (await synopsisRef.get()).data();

  if (synopsis == undefined) throw error(404, "Synopsis Not Found");

  let hours: { member: SecondaryUser; time: number }[] = [];

  for (let i = 0; i < synopsis.hours.length; i++) {
    try {
      let member = await getMember(synopsis.hours[i].member.id, locals.team);

      hours.push({
        member,
        time: synopsis.hours[i].time,
      });
    } catch (e) {
      let member = getDefault(synopsis.hours[i].member.id);

      hours.push({
        member,
        time: synopsis.hours[i].time,
      });
    }
  }

  return {
    meeting: meeting,
    synopsis: {
      body: synopsis.synopsis as string,
      hours: hours,
      attachments: synopsis.urls as {
        url: string;
        type: string;
        name: string;
        location: string;
        code: string;
        ext: string;
      }[],
    },
  };
}
