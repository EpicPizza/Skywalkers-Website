import { getUser } from "$lib/Firebase/firebase.server";
import type { Handle, RequestHandler } from "@sveltejs/kit";

export const handle = (async ({ event, resolve}) => {
    console.log(event.route);

    const theme = event.cookies.get('theme');

    let scheme: string;

    if(theme == 'light' || theme == 'dark' || theme == 'system|dark' || theme == 'system|light') {  
        scheme = theme.endsWith('light') ? 'light' : 'dark';
    } else {
        scheme = 'light dark';
    }

    const user = await getUser(event.cookies.get("session") != undefined ? event.cookies.get("session") as string : "");

    event.locals.user = user;
    event.locals.team = user != undefined ? (user.customClaims != undefined && user.customClaims['team']) : false;

	const response = await resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%theme%', scheme),
    });

    return response;
}) satisfies Handle;