import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuth as adminAuth} from 'firebase-admin/auth'
import { firebaseAdmin, getUser } from '$lib/Firebase/firebase.server';
import { DEV } from '$env/static/private';

export const POST = (async ({ request, cookies }) => { // TODO: csrf protection
    const encodedToken = request.headers.get('Authorization')?.split(' ')[1];

    if(encodedToken == undefined) {
        throw error(401, "UNAUTHORIZED REQUEST");
    }

    const expiresIn = 1000 * 60 * 60 * 24;

    var recent = await checkRecent(encodedToken);

    if(!recent) {
        throw error(401, "UNAUTHORIZED REQUEST");
    }

    console.log("here"); //goofy code that I made when I didn't realize .then was just another way to use promises

    const success = await new Promise((resolve) => {
        firebaseAdmin.getAuth()
            .createSessionCookie(encodedToken, {expiresIn})
                .then(
                    (sessionCookie) => {
                        console.log("got cookie");
                        const options = { maxAge: expiresIn, httpOnly: true, secure: DEV == 'TRUE' ? false : true, path: "/", sameSite: true };
                        cookies.set("session", sessionCookie, options)
                        console.log(sessionCookie);
                        resolve(json({'Authorization': 'Success'}));
                    },  
                    (error) => {
                        console.log(error);
                        resolve("failed");
                    }
                ).catch((e) => {
                    console.log(e);
                })
    })

    if(success == "failed") {
        throw error(401, "UNAUTHORIZED REQUEST");
    } else {
        return success as Response;
    }
}) satisfies RequestHandler;

async function checkRecent(idToken: string): Promise<Boolean> { //prevents using stolen token
    return new Promise((resolve) => {
        firebaseAdmin.getAuth()
            .verifyIdToken(idToken)
            .then((decodedIdToken) => {
                if (new Date().getTime() / 1000 - decodedIdToken.auth_time < 5 * 60) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
    })
}