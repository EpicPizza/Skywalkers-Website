import { DOMAIN, DOWN } from "$env/static/private";
import { firebaseAdmin, getUser } from "$lib/Firebase/firebase.server";
import { getSpecifiedRoles } from "$lib/Roles/role.server";
import type { Handle, RequestHandler } from "@sveltejs/kit";
import type { DocumentReference } from "firebase-admin/firestore";
import { z } from "zod";

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

    let team: null | string = null;

    if(event.url.href.startsWith(DOMAIN + "/t/")) {
        const param = event.url.href.substring(DOMAIN.length + 3, DOMAIN.length + 9);

        event.locals.unverifiedTeam = null;

        try {
            team = z.coerce.number().min(111111).max(999999).parse(param).toString();

            event.locals.unverifiedTeam = team;

            console.log("Team", param);
        } catch(e) {
            console.log(e);
        }
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
        event.locals.team = null;
        event.locals.firestoreUser = undefined;
        event.locals.permissions = [];
        event.locals.level = 0;
        event.locals.kicked = false;
        event.locals.teamInfo = new Map();
        if(event.locals.unverifiedTeam) {
            const doc = (await db.collection('teams').doc(event.locals.unverifiedTeam).collection('settings').doc('info').get());
            if(doc.exists) {
                event.locals.teamInfo.set(event.locals.unverifiedTeam, doc.data() as { name: string, website: string, icon: string });
            }
        }
    } else {
        const firestoreUser = (await db.collection('users').doc(user.uid).get()).data();

        if(firestoreUser == undefined) {
            event.locals.team = null;
            event.locals.firestoreUser = undefined;
            event.locals.permissions = [];
            event.locals.level = 0;
            event.locals.kicked = false;
            event.locals.teamInfo = new Map();

            if(event.locals.unverifiedTeam) {
                const doc = (await db.collection('teams').doc(event.locals.unverifiedTeam).collection('settings').doc('info').get());
                if(doc.exists) {
                    event.locals.teamInfo.set(event.locals.unverifiedTeam, doc.data() as { name: string, website: string, icon: string });
                }
            }
        } else {
            event.locals.team = team ? team : firestoreUser.teams[0].team;
            event.locals.permissions = [];
            event.locals.level = 0;
            event.locals.teamInfo = new Map();

            let found = false;

            for(let i = 0; i < firestoreUser.teams.length; i++) {
                if(firestoreUser.teams[i].team == event.locals.team) {
                    event.locals.permissions = firestoreUser.teams[i].permissions;
                    event.locals.level = firestoreUser.teams[i].level;

                    found = true;
                }

                event.locals.teamInfo.set(firestoreUser.teams[i].team, (await db.collection('teams').doc(firestoreUser.teams[i].team).collection('settings').doc('info').get()).data() as { name: string, website: string, icon: string });

                firestoreUser.teams[i].roles = await getSpecifiedRoles(firestoreUser.teams[i].roles as DocumentReference[]);
            }

            if(found == false) {
                event.locals.team = null;
            }


            event.locals.firestoreUser = {
                ...firestoreUser as any,
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
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Access-Control-Allow-Headers', 'uploader-chunk-number,uploader-chunks-total,uploader-file-id');
    response.headers.set('Cache-Control', 'no-cache, private');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
}) satisfies Handle;