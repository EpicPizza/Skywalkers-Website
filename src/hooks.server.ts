import { DOWN } from "$env/static/private";
import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
import { getSpecifiedRoles } from "$lib/Roles/role.server";
import type { Handle, RequestHandler } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";

export const handle = (async ({ event, resolve }) => {
    if(DOWN != "FALSE") {
        const response = new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/x-icon" href="/favicon.webp"><title>Skywalkers | Down</title><link href="style.css" rel="stylesheet" type="text/css" /><script src="https://cdn.tailwindcss.com"></script><link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;0,1000;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></head><body style="font-family: Nunito, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Open Sans\', \'Helvetica Neue\', sans-serif; height: 100svh;" class="bg-white flex items-center justify-around"><div><h1 class="text-3xl mb-2 text-center font-bold">Down for Maintenance</h1><h2 class="text-xl text-center">Scheduled until ' + DOWN + '</h2></div><div class="absolute bottom-4"><a href="https://www.frcskywalkers.org/" class="flex items-center"><img class="w-7 rounded-md h-7 mr-2" src="/favicon.webp"/><h3>FRC Skywalkers</h3></a></div></body></html>', { status: 200, headers: { "content-type": "text/html"} });
        
        response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
        response.headers.set('Cross-Origin-Embedder-Policy', 'same-origin');
        response.headers.set('Cache-Control', 'no-cache, private');
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        response.headers.set('X-Content-Type-Options', 'nosniff');
    
        return response;
    }

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
    response.headers.set('Cache-Control', 'no-cache, private');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
}) satisfies Handle;