import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { error, redirect } from "@sveltejs/kit";

export async function load({ params, locals }) {
  if (locals.user == undefined) throw error(401, "Sign In Required");
  if (locals.firestoreUser == undefined || locals.team == undefined)
    throw redirect(307, "/verify");

  if (!locals.permissions.includes("VIEW_LOGS")) throw error(403, "Forbidden");

  let on: number = parseInt(params.page);

  if (isNaN(on) || on < 1) throw error(400, "Invalid Page Number");

  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("logs").where("team", "==", locals.team);

  let count = (await ref.count().get()).data().count;

  if (on * 50 - 50 > count) throw error(400, "Invalid Page Number");

  const docs = (
    await ref
      .orderBy("timestamp", "desc")
      .offset((on - 1) * 50)
      .limit(50)
      .get()
  ).docs;

  let logs = new Array<{
    content: string;
    timestamp: Date;
    icon: string;
    id: string;
  }>();

  for (let i = 0; i < docs.length; i++) {
    if (docs[i].data() == undefined) continue;

    logs.push({
      content: docs[i].data().content,
      timestamp: docs[i].data().timestamp.toDate(),
      icon: docs[i].data().icon,
      id: docs[i].data().id,
    });
  }

  return {
    page: {
      total: {
        count: count,
        pages: Math.ceil(count / 50),
      },
      on: on,
      beginning: on == 1,
      end: on >= Math.ceil(count / 50),
      showing: (on - 1) * 50 + 1 + " - " + (count > on * 50 ? on * 50 : count),
    },
    logs: logs,
  };
}
