import type { Teams } from "$lib/Firebase/firebase";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import type { Role } from "$lib/Roles/role";
import { getSpecifiedRolesWithTransaction } from "$lib/Roles/role.server";
import { error, json } from "@sveltejs/kit";
import type {
  DocumentReference,
  DocumentSnapshot,
} from "firebase-admin/firestore";
import { z } from "zod";

const PERMISSIONS = z.string().min(1).max(100).array();
const ROLE = z.string().min(1).max(100);

export const POST = async ({ locals, request }) => {
  if (
    locals.user == undefined ||
    locals.team == undefined ||
    locals.firestoreUser == undefined
  ) {
    throw error(401, "AUTHORIZATION REQUIRED");
  }

  if (!locals.permissions.includes("MANAGE_ROLES")) throw 403;

  const req = await request.json();

  const permissions = PERMISSIONS.parse(req.permissions);
  const role = ROLE.parse(req.role);

  const db = firebaseAdmin.getFirestore();

  const ref = db
    .collection("teams")
    .doc(locals.team)
    .collection("roles")
    .doc(role);

  const team = locals.team;
  const user = locals.user.uid;

  let roleCheck = await ref.get();

  if (!roleCheck.exists) throw error(400);

  if ((roleCheck.data()?.level as number) >= locals.level) throw 403;

  await db.runTransaction(async (transaction) => {
    const role = (await transaction.get(ref)).data() as Role;
    let userRefs: DocumentReference[] | DocumentSnapshot[];
    if (role.name != "everyone") {
      userRefs = role.members as unknown as DocumentReference[]; //type says its type SecondaryUser, but directly from firestore, its a references
    } else {
      userRefs = (
        await transaction.get(
          db.collection("users").where("team", "array-contains", team),
        )
      ).docs;
    }

    let userPermissions = new Map<string, Teams>();

    for (let i = 0; i < userRefs.length; i++) {
      let doc: DocumentSnapshot;
      let userRef = userRefs[i];
      if ("exists" in userRef) {
        doc = userRef;
      } else {
        doc = await transaction.get(userRef);
      }

      if (doc.exists) {
        const teams = doc.data()?.teams as Teams;

        let rolesRef: DocumentReference[] = [];

        for (let i = 0; i < teams.length; i++) {
          if (teams[i].team == locals.team) {
            rolesRef = teams[i].roles as unknown as DocumentReference[];
          }
        }

        const roles = await getSpecifiedRolesWithTransaction(
          rolesRef,
          transaction,
          team,
        );

        let newPermissions = new Array<string>();

        let level = 0;

        for (let j = 0; j < roles.length; j++) {
          if (roles[j].id != ref.id) {
            for (let x = 0; x < roles[j].permissions.length; x++) {
              if (!newPermissions.includes(roles[j].permissions[x])) {
                newPermissions.push(roles[j].permissions[x]);
              }
            }

            if (roles[j].level > level) {
              level = roles[j].level;
            }
          }
        }

        console.log(newPermissions);

        for (let x = 0; x < permissions.length; x++) {
          if (!newPermissions.includes(permissions[x])) {
            newPermissions.push(permissions[x]);
          }
        }

        if (role.level > level) {
          level = role.level;
        }

        for (let i = 0; i < teams.length; i++) {
          if (teams[i].team == locals.team) {
            teams[i].permissions = newPermissions;
            teams[i].level = level;
          }
        }

        userPermissions.set(userRefs[i].id, teams);
      }
    }

    transaction.update(ref, {
      permissions: permissions,
    });

    for (let i = 0; i < userRefs.length; i++) {
      let ref: DocumentReference;
      let userRef = userRefs[i];
      if ("exists" in userRef) {
        ref = userRef.ref;
      } else {
        ref = userRef;
      }

      if (userPermissions.get(ref.id) != undefined) {
        transaction.update(ref, {
          teams: userPermissions.get(userRefs[i].id),
        });
      }
    }

    firebaseAdmin.addLogWithTransaction(
      "Edited a role.",
      "group",
      user,
      transaction,
      team,
    );
  });

  return json("success");
};
