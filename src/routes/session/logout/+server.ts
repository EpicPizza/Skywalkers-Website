import { DEV } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST = (async ({ request, cookies }) => {
    cookies.delete("session", {path: "/", sameSite: true});
    cookies.set("session", "", { maxAge: 0, httpOnly: true, secure: DEV == 'TRUE' ? false : true, path: "/", sameSite: true });

    console.log("Cookie Deleted")

    return json({"deletion": "success"});
}) satisfies RequestHandler;