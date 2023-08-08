import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";

const AddHours = z.object({
    reason: z.string().max(500),
})

export async function load({ locals, params, url }) {
    if(locals.user == undefined) throw error(401, "Sign In Required");
    if(locals.firestoreUser == undefined) throw redirect(307, "/verify");

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(locals.firestoreUser.team).collection('hours').doc(params.slug);

    const doc = await ref.get();

    if(!doc.exists) throw error(400, "Hours not found.");

    type indicator = { color: string, icon: string };
    const data = doc.data() as { total: number, entries: { total: number, history: { hours: number, reason: string | null, link: string | null, indicator: indicator, id: string | null }[] }[] };

    if(!data) throw error(400, "Hours not found.");

    return { hours: data };
}