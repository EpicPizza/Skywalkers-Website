import { DEV } from "$env/static/private";
import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { editEvent } from "$lib/Google/calendar";
import { getCalendar, getClientWithCrendentials } from "$lib/Google/client";
import {
  getMeeting,
  getMeetings,
  sendConfirmations,
} from "$lib/Meetings/helpers.server.js";
import { error } from "@sveltejs/kit";
import { z } from "zod";

export async function POST({ request, params, url, locals }) {
  const team = locals.unverifiedTeam;

  if (team == null) throw error(400, "Not allowed.");

  const client = await getClientWithCrendentials();

  if (client == undefined) throw new Error("Client not authorized");

  const calendar = await getCalendar();

  if (calendar == undefined) throw new Error("Client not authorized");

  const db = firebaseAdmin.getFirestore();

  const ref = db
    .collection("teams")
    .doc(team)
    .collection("meetings")
    .where("update", "==", true)
    .limit(100);

  const res = await db.runTransaction(async (t) => {
    const res = await t.get(ref);

    for (let i = 0; i < res.docs.length; i++) {
      t.update(res.docs[i].ref, {
        update: false,
      });
    }

    return res;
  });

  const docs = res.docs;

  try {
    for (let i = 0; i < docs.length; i++) {
      const data = docs[i].data();

      if (data == undefined) continue;

      const event = data.calendar as string;
      const signups = data.signups as string[];

      const users = await firebaseAdmin
        .getAuth()
        .getUsers(Array.from(signups, (x) => ({ uid: x as string })));

      const attendees = Array.from(users.users, (x) => ({
        email: x.email as string,
      }));

      await editEvent(client, event, calendar, { attendees: attendees });
    }
  } catch (e) {
    const db = firebaseAdmin.getFirestore();

    await db.runTransaction(async (t) => {
      for (let i = 0; i < res.docs.length; i++) {
        t.update(res.docs[i].ref, { update: true });
      }
    });

    throw e;
  }

  return new Response("No Content", { status: 200 });
}
