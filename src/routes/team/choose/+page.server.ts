import { firebaseAdmin } from "$lib/Firebase/firebase.server";

export async function load() {
  const db = firebaseAdmin.getFirestore();

  const teams = await db.collection("teams").listDocuments();

  const teamInfo = new Array<{
    website: string;
    name: string;
    icon: string;
    id: string;
  }>();

  for (let i = 0; i < teams.length; i++) {
    const ref = teams[i].collection("settings").doc("info");

    const data = (await ref.get()).data();

    teamInfo.push({ ...(data as any), id: teams[i].id }); //should never be empty
  }

  return {
    teams: teamInfo,
  };
}
