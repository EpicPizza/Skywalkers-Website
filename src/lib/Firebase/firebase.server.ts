import admin from 'firebase-admin'
import { FIREBASE_ADMIN } from '$env/static/private';
import FirebaseAdmin from 'firebase-admin';
const firebaseAuth = FirebaseAdmin.auth;
import type { Auth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { AuthCredential } from 'firebase/auth';
import { type Firestore, getFirestore as getFirebaseFirestore, DocumentReference } from 'firebase-admin/firestore';
import { getSpecifiedRoles } from '$lib/Roles/role.server';
import type { FirestoreUser, SecondaryUser } from './firebase';

export let firebaseAdmin = getFirebaseAdmin();

function getFirebaseAdmin() {
    let app: admin.app.App | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let firestore: Firestore | undefined = undefined;

    const getFirebaseApp = (): admin.app.App => {
        if(app == undefined) { //this get reruns on every change durring preview, but firebase admin still sees the pervious instance made, so this just checks if we can use a previous firebase instance, otherwise it will cause an error because firebase thinks we are reintializing
            if(admin.apps == null) {
                app = admin.initializeApp({
                    credential: (admin.credential.cert(JSON.parse(FIREBASE_ADMIN) as admin.ServiceAccount))
                }, "Server");
            } else if(admin.apps.length == 0) {
                app = admin.initializeApp({
                    credential: (admin.credential.cert(JSON.parse(FIREBASE_ADMIN) as admin.ServiceAccount))
                }, "Server");
            } else {
                var found = false;
                for(var i = 0; i < admin.apps.length; i++) {
                    if(admin.apps[i] != null && (admin.apps[i] as admin.app.App).name == "Server") {
                        app = admin.apps[i] as admin.app.App;
                        found = true;
                    }
                }
                if(found == false) {
                    throw new Error("Firebase Admin is being goofy again");
                }
            }
        }
    
        return app as admin.app.App;
    }

    const getAuth = (): Auth => {
        if(auth == undefined) {
            auth = firebaseAuth(getFirebaseApp());
        }

        return auth;
    }

    const getFirestore = (): Firestore => {
        if(firestore == undefined) {
            firestore = getFirebaseFirestore(getFirebaseApp());
        }

        return firestore;
    }

    return {
        getApp: getFirebaseApp,
        getAuth: getAuth,
        getFirestore: getFirestore,
    }
}

export async function seralizeFirestoreUser(user: any, id: string): Promise<SecondaryUser | undefined> {
    if(user == undefined) return undefined;
    return {
        ...user,
        id: id,
        roles: await getSpecifiedRoles(user.roles as DocumentReference[]),
    }
}

export function verifySession(session: string | undefined) {
    return new Promise((resolve) => {
        if(session == undefined) {
            resolve(false);
            return;
        }
        
        firebaseAdmin.getAuth()
            .verifySessionCookie(session, true)
                .then((decodedToken) => {
                    resolve(true);
                    return;
                })
                .catch((error) => {
                    resolve(false);
                    return;
                })
    })
}

export async function getUser(session: string): Promise<UserRecord | undefined> {
    try {
        const decodedToken = await firebaseAdmin.getAuth().verifySessionCookie(session, true);
        const user = await firebaseAdmin.getAuth().getUser(decodedToken.uid);
        return user;
    } catch(e) {
        console.log(e);
        return undefined; 
    }
}

export function getToken(session: string): Promise<DecodedIdToken | undefined> {
    return new Promise<DecodedIdToken | undefined>((resolve) => {
        firebaseAdmin.getAuth()
            .verifySessionCookie(session, true)
                .then((decodedToken) => {
                    resolve(decodedToken);
                    return;
                })
                .catch((error) => {
                    resolve(undefined);
                    return;
                })
    })
}