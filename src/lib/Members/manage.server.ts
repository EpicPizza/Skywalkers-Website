import { unlink } from "$lib/Discord/link.server";
import type { SecondaryUser, Teams } from "$lib/Firebase/firebase";
import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
import { getDefault, getDefaultRole } from "$lib/Meetings/helpers";
import type { Role } from "$lib/Roles/role";
import {
  getRolesAsCache,
  getSpecifiedRoles,
  getSpecifiedRolesWithTransaction,
} from "$lib/Roles/role.server";
import { error } from "@sveltejs/kit";
import { randomBytes, scryptSync } from "crypto";
import {
  FieldValue,
  type DocumentReference,
  type Transaction,
} from "firebase-admin/firestore";

export async function kickMember(id: string, team: string) {
  const db = firebaseAdmin.getFirestore();

  const userRef = db.collection("users").doc(id);

  const deleted = await db.runTransaction(async (t) => {
    const member = await getMemberWithTransaction(id, team, t);

    const hoursRef = db
      .collection("teams")
      .doc(team)
      .collection("hours")
      .doc(member.id);

    const hours = await t.get(hoursRef);

    if (hours.exists && hours.data()) {
      t.delete(hoursRef);
    }

    let currentTeam: Teams[0] = (() => {
      let found: Teams[0] | null = null;

      for (let i = 0; i < member.teams.length; i++) {
        if (member.teams[i].team == team) {
          found = member.teams[i];
          member.teams.splice(i, 1);
        }
      }

      if (found == null) throw new Error("Not part of team");

      return found;
    })();

    for (let i = 0; i < currentTeam.roles.length; i++) {
      t.update(
        db
          .collection("teams")
          .doc(currentTeam.team)
          .collection("roles")
          .doc(currentTeam.roles[i].id),
        {
          members: FieldValue.arrayRemove(db.collection("users").doc(id)),
        },
      );
    }

    t.update(userRef, {
      teams: member.teams,
      team: Array.from(member.teams, (v) => v.team),
    });

    if (member.teams.length == 0) {
      return true;
    } else {
      return false;
    }
  });

  if (deleted) {
    await unlink(id);

    await userRef.delete();
    await userRef.collection("settings").doc("confirmations").delete();
    await userRef.collection("settings").doc("discord").delete();

    const folderPath = `users/${id}`;

    await new Promise((resolve) => {
      firebaseAdmin.getBucket().deleteFiles(
        {
          prefix: folderPath,
        },
        (err, files) => {
          if (err) {
            console.log(err);

            throw error(
              501,
              "An unexpected error occurred, please contact us for further help.",
            );
          }

          resolve(null);
        },
      );
    });
  }
}

export async function getMemberCache(
  team: string,
  roles: Map<string, Role>,
): Promise<Map<string, SecondaryUser>> {
  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("users").where("team", "array-contains", team);

  const docs = (await ref.get()).docs;

  const users = new Map<string, SecondaryUser>();

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];

    const user = doc.data();

    if (user == undefined) throw new Error("User not found.");

    for (let j = 0; j < user.teams.length; j++) {
      if (user.teams[j].team == team) {
        user.teams[j].roles = Array.from(
          user.teams[j].roles,
          (role: DocumentReference) => {
            return roles.get(role.id) ?? getDefaultRole(role.id);
          },
        );
      } else {
        user.teams[j].roles = [];
      }
    }

    users.set(docs[i].id, {
      ...user,
      id: doc.id,
    } as SecondaryUser);
  }

  return users;
}

export async function getMember(
  id: string,
  team: string,
  silenced = false,
): Promise<SecondaryUser> {
  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("users").doc(id);

  try {
    const doc = await ref.get();

    if (!doc.exists) throw new Error("User not found.");

    const user = doc.data();

    if (user == undefined) throw new Error("User not found.");

    for (let j = 0; j < user.teams.length; j++) {
      if (user.teams[j].team == team) {
        user.teams[j].roles = await getSpecifiedRoles(user.teams[j].roles);
      } else {
        user.teams[j].roles = [];
      }
    }

    return {
      ...user,
      id: doc.id,
    } as SecondaryUser;
  } catch (e) {
    console.log(silenced);

    if (silenced) {
      console.log(e);

      return getDefault(id);
    } else {
      throw e;
    }
  }
}

export async function getMemberWithTransaction(
  id: string,
  team: string,
  t: Transaction,
): Promise<SecondaryUser> {
  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("users").doc(id);

  const doc = await t.get(ref);

  if (!doc.exists) throw new Error("User not found.");

  const user = doc.data();

  if (user == undefined) throw new Error("User not found.");

  for (let j = 0; j < user.teams.length; j++) {
    if (user.teams[j].team == team) {
      user.teams[j].roles = await getSpecifiedRolesWithTransaction(
        user.teams[j].roles,
        t,
        team,
      );
    } else {
      user.teams[j].roles = [];
    }
  }

  return {
    ...user,
    id: doc.id,
  } as SecondaryUser;
}
