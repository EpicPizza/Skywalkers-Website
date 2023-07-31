import { redirect } from "@sveltejs/kit";

export function load() {
    throw redirect(307, "/meetings/completed/1");
}