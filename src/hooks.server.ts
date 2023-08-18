import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
import { getSpecifiedRoles } from "$lib/Roles/role.server";
import type { Handle, RequestHandler } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";

export const handle = (async ({ event, resolve }) => {
    console.log(event.route);

    const theme = event.cookies.get('theme');

    let scheme: string;

    if(theme == 'light' || theme == 'dark' || theme == 'system|dark' || theme == 'system|light') {  
        scheme = theme.endsWith('light') ? 'light' : 'dark';
    } else {
        scheme = 'light dark';
    }

    const user = await getUser(event.cookies.get("__session") != undefined ? event.cookies.get("__session") as string : "");

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

            const quaraantinedUser = (await db.collection('quarantine').doc(user.uid).get());
            event.locals.kicked = quaraantinedUser.exists;
        } else {
            event.locals.team = true;
            event.locals.firestoreUser = {
                ...firestoreUser as any,
                roles: await getSpecifiedRoles(firestoreUser.roles as DocumentReference[]),
            };
            event.locals.kicked = false;
        }
    }
	const response = await resolve(event, {
        transformPageChunk: ({ html }) => html.replaceAll('%theme%', scheme),
    });
    
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'same-origin');
    response.headers.set('Cache-Control', 'no-cache');

    return response;
}) satisfies Handle;