import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import {
  getFetchedMeetingsOptimized,
  type FetchedMeeting,
} from "$lib/Meetings/helpers.server";
import { getMemberCache } from "$lib/Members/manage.server.js";
import { getRolesAsCache } from "$lib/Roles/role.server";
import { error, redirect } from "@sveltejs/kit";
import safeCompare from "safe-compare";

export async function load({ locals, url }) {
  const isPublic =
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

  if (
    isPublic &&
    safeCompare(isPublic, url.searchParams.get("public") ?? "000000")
  ) {
    if (locals.team == locals.unverifiedTeam) {
      throw redirect(307, "/t/" + locals.team + "/meetings");
    }

    locals.team = locals.unverifiedTeam as string;
  } else {
    if (locals.user == undefined) throw error(401, "Sign In Required");

    if (locals.team == null || locals.firestoreUser == undefined)
      throw redirect(307, "/verify?needverify=true");

    if (!locals.permissions.includes("VIEW_MEETINGS"))
      throw error(403, "Unauthorized.");
  }

  let today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setMilliseconds(0);

  const ref = firebaseAdmin
    .getFirestore()
    .collection("teams")
    .doc(locals.team)
    .collection("meetings")
    .where("completed", "==", false)
    .where("starts", ">=", today)
    .orderBy("starts")
    .limit(50);

  const roles = await getRolesAsCache(locals.team);
  const members = await getMemberCache(locals.team, roles);
  const meetings = await getFetchedMeetingsOptimized(
    ref,
    locals.user ? locals.user.uid : "000000",
    locals.team,
    members,
    roles,
  );

  return {
    meetings: meetings as unknown as FetchedMeeting[],
    reachedEnd:
      (
        await firebaseAdmin
          .getFirestore()
          .collection("teams")
          .doc(locals.team)
          .collection("meetings")
          .where("completed", "==", false)
          .where("starts", ">=", today)
          .count()
          .get()
      ).data().count == meetings.length,
    meetingsShown: meetings.length,
    loading: false,
    completed: false,
    deleted: url.searchParams.get("deleted") === "true" ? true : false,
    verified: original != null,
    public:
      isPublic &&
      safeCompare(isPublic, url.searchParams.get("public") ?? "000000")
        ? url.searchParams.get("public") ?? "000000"
        : null,
  };
}
