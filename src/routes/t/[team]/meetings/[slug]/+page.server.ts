import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import {
  type FetchedMeeting,
  getFetchedMeeting,
} from "$lib/Meetings/helpers.server";
import { error, redirect } from "@sveltejs/kit";
import safeCompare from "safe-compare";

export async function load({ params, locals, url }) {
  const checkingPublic =
    (
      await firebaseAdmin
        .getFirestore()
        .collection("teams")
        .doc(locals.unverifiedTeam ?? "000000")
        .collection("settings")
        .doc("meetings")
        .get()
    ).data()?.public ?? false;

  let original = locals.team;

  let isPublic = false;

  if (
    checkingPublic &&
    safeCompare(checkingPublic, url.searchParams.get("public") ?? "000000")
  ) {
    if (locals.team == locals.unverifiedTeam) {
      throw redirect(307, "/t/" + locals.team + "/meetings/" + params.slug);
    }

    isPublic = true;

    locals.team = locals.unverifiedTeam as string;
  } else {
    if (locals.user == undefined) throw error(401, "Sign In Required");

    if (locals.team == null || locals.firestoreUser == undefined)
      throw redirect(307, "/verify?needverify=true");

    if (!locals.permissions.includes("VIEW_MEETINGS"))
      throw error(403, "Unauthorized.");
  }

  let meeting: FetchedMeeting | false = false;

  try {
    meeting = await getFetchedMeeting(
      params.slug,
      locals.user ? locals.user.uid : "000000",
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

  if (isPublic && meeting.completed)
    throw error(400, "Cannot view completed meetings without account.");

  return {
    meeting: meeting,
    status: {
      created: url.searchParams.get("created") === "true" ? true : false,
      edited: url.searchParams.get("edited") === "true" ? true : false,
    },
    verified: original != null,
    public:
      checkingPublic &&
      safeCompare(checkingPublic, url.searchParams.get("public") ?? "000000")
        ? url.searchParams.get("public") ?? "000000"
        : null,
  };
}
