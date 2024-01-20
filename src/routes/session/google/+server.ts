import { redirect } from "@sveltejs/kit";
import { EMAIL } from "$env/static/private";
import { encrypt, getClient } from "$lib/Google/client";
import { createHash, randomBytes } from "node:crypto";
import { CodeChallengeMethod } from "google-auth-library";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";

export const GET = async ({ locals }) => {
  if (!locals.user || locals.user.email != EMAIL) throw redirect(307, "/");

  throw redirect(307, await getAuth());
};

async function getAuth() {
  return getClient().generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/calendar",
    prompt: "consent",
    code_challenge: await hash(),
    code_challenge_method: CodeChallengeMethod.S256,
    login_hint: EMAIL,
  });
}

async function hash() {
  const random = crypto.randomUUID();

  const db = firebaseAdmin.getFirestore();

  const ref = db.collection("google").doc("flow");

  const { encryptedValue, iv } = await encrypt(random);

  ref.set({
    verifier: encryptedValue,
    iv: iv,
  });

  const hash = createHash("sha256").update(crypto.randomUUID()).digest("hex");

  console.log(hash);

  return createHash("sha256").update(random).digest("base64url");
}
