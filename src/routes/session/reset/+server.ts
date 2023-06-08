import { firebaseAdmin, getToken, getUser, verifySession } from "$lib/Firebase/firebase.server";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { DecodedIdToken } from "firebase-admin/auth";

export const POST = (async ({ request, cookies }) => {
    const authorized = await verifySession(cookies.get("session"))

    if(authorized) {
        const token: DecodedIdToken = await getToken(cookies.get("session") as string) as DecodedIdToken;
        
        await firebaseAdmin.getAuth().revokeRefreshTokens(token.sub); //tldr signs out all devices

        cookies.delete('session');

        return json({"deletion": "success"});
    } else {
        throw error(403, "AUTHORIZED");
    }
}) satisfies RequestHandler;