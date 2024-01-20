import type { Code } from "$lib/Codes/codes";
import { firebaseAdmin, getPhotoURL } from "$lib/Firebase/firebase.server.js";
import { error, redirect } from "@sveltejs/kit";
import { FieldValue } from "firebase-admin/firestore";
import safeCompare from "safe-compare";

export async function load({ locals, params }) {
  if (locals.unverifiedTeam == locals.team)
    throw error(400, "Already part of team.");
  if (locals.unverifiedTeam == undefined) throw error(400, "Invalid team");

  const id = params.slug;

  const db = firebaseAdmin.getFirestore();

  const teamsRef = db.collection("teams");

  const teams = (await teamsRef.get()).docs;

  let role: string | undefined = undefined;

  let team: string = locals.unverifiedTeam;

  for (let i = 0; i < teams.length; i++) {
    if (teams[i].id == team) {
      const codes = new Map<string, Code>(Object.entries(teams[i].data()));

      codes.forEach((code) => {
        if (safeCompare(id, code.id)) {
          role = code.role;
          team = teams[i].id;
        }
      });
    }
  }

  if (role == undefined) throw error(404, "Not Found");

  return {
    unverifiedTeam: locals.unverifiedTeam,
  };
}

export const actions = {
  default: async function ({ locals, params }) {
    if (locals.user == undefined) throw redirect(307, "/?signin=true");
    if (locals.unverifiedTeam == locals.team)
      throw error(400, "Already part of team.");
    if (locals.unverifiedTeam == undefined) throw error(400, "Invalid team");

    const db = firebaseAdmin.getFirestore();

    if (locals.firestoreUser == undefined) {
      const { found, member, team, permissions } = await findCode(
        params.slug,
        locals.user?.email,
        locals.unverifiedTeam,
      );

      let photoURL = await getPhotoURL(
        locals.user.photoURL as string,
        locals.user.uid,
      );

      db.collection("users")
        .doc(locals.user.uid)
        .set({
          displayName: locals.user.displayName,
          photoURL: photoURL,
          pronouns: "",
          team: [team],
          teams: [
            {
              role: found.role,
              permissions: permissions,
              level: 0,
              roles: [],
              team: team,
            },
          ],
        });

      const hoursRef = db
        .collection("teams")
        .doc(team)
        .collection("hours")
        .doc(locals.user.uid);

      await firebaseAdmin.addLog("Joined the team.", "person", locals.user.uid);

      await hoursRef.set({
        total: 0,
        entries: [],
        deleted: false,
        history: [],
      });

      throw redirect(307, "/t/" + locals.unverifiedTeam);
    } else {
      const { found, member, team, permissions } = await findCode(
        params.slug,
        locals.user?.email,
        locals.unverifiedTeam,
      );

      const hoursRef = db
        .collection("teams")
        .doc(team)
        .collection("hours")
        .doc(locals.user.uid);

      db.collection("users")
        .doc(locals.user.uid)
        .update({
          team: FieldValue.arrayUnion(team),
          teams: FieldValue.arrayUnion({
            role: found.role,
            permissions: permissions,
            level: 0,
            roles: [],
            team: team,
          }),
        });

      await firebaseAdmin.addLog("Joined the team.", "person", locals.user.uid);

      await hoursRef.set({
        total: 0,
        entries: [],
        deleted: false,
        history: [],
      });

      throw redirect(307, "/t/" + locals.unverifiedTeam);
    }
  },
};

async function findCode(id: string, email: string | undefined, team: string) {
  const db = firebaseAdmin.getFirestore();

  const teamsRef = db.collection("teams");

  const teams = (await teamsRef.get()).docs;

  let found: Code = undefined as unknown as Code;
  let member: string = undefined as unknown as string;

  for (let i = 0; i < teams.length; i++) {
    if (teams[i].id == team) {
      const codes = new Map<string, Code>(Object.entries(teams[i].data()));

      codes.forEach((code, key) => {
        let exists = safeCompare(id, code.id);
        let anyone = safeCompare("anyone", code.access);
        let access = safeCompare(email as unknown as string, code.access);

        if (exists && (anyone || access)) {
          found = code;
          member = key;
          team = teams[i].id;
        }
      });
    }
  }

  if (found == undefined || team == undefined || member == undefined)
    throw error(400, "An error occurred. (Possibly wrong email)");

  await db
    .collection("teams")
    .doc(team)
    .update({
      [member]: FieldValue.delete(),
    });

  const everyone = (
    await firebaseAdmin
      .getFirestore()
      .collection("teams")
      .doc(team)
      .collection("roles")
      .where("level", "==", 0)
      .get()
  ).docs[0];

  let everyoneRole = {
    color: everyone.data().color as string,
    permissions: everyone.data().permissions as string[],
    level: everyone.data().level as number,
    name: everyone.data().name as string,
    connectTo: everyone.data().connectTo as string | null,
    members: [],
    id: everyone.ref.id,
  };

  return { found, team, member, permissions: everyoneRole.permissions };
}
