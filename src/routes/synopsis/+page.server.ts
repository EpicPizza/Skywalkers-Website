import { redirect } from "@sveltejs/kit";

export async function load({ url }) {
    throw redirect(301, "/t/329832" + url.pathname + url.search)
}
