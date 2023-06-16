import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
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

    const db = firebaseAdmin.getFirestore();

    if(user == undefined) {
        event.locals.team = false;
        event.locals.firestoreUser = undefined;
    } else {
        const firestoreUser = (await db.collection('users').doc(user.uid).get()).data();

        if(firestoreUser == undefined) {
            event.locals.team = false;
            event.locals.firestoreUser = undefined;
        } else {
            event.locals.team = true;
            event.locals.firestoreUser = firestoreUser as any;
        }
    }

	const response = await resolve(event, {
        transformPageChunk: ({ html }) => html.replaceAll('%theme%', scheme),
    });

    return response;
}) satisfies Handle;