import { DEV } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST = (async ({ request, cookies }) => {
    cookies.delete("session", {path: "/"});
    cookies.set("session", "", { maxAge: 0, httpOnly: true, secure: DEV == 'TRUE' ? false : true, path: "/", sameSite: "lax" });

    console.log("Cookie Deleted")

    return json({"deletion": "success"});
}) satisfies RequestHandler;