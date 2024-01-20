import { redirect } from "@sveltejs/kit";

export async function load({ locals }) {
    throw redirect(307, "/t/" + locals.team + "/logs/1")
}