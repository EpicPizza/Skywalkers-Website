import admin from 'firebase-admin'
import { ADMIN, DEV } from '$env/static/private';
import FirebaseAdmin from 'firebase-admin';
const firebaseAuth = FirebaseAdmin.auth;
import type { Auth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { AuthCredential } from 'firebase/auth';
import { type Firestore, getFirestore as getFirebaseFirestore, DocumentReference } from 'firebase-admin/firestore';
import { getSpecifiedRoles } from '$lib/Roles/role.server';
import type { FirestoreUser, SecondaryUser } from './firebase';
import type { Storage } from 'firebase-admin/lib/storage/storage';
import { getStorage } from 'firebase-admin/storage';
import type { Bucket } from '@google-cloud/storage';
import Stream from 'stream';
import * as https from 'https';
import path from 'path';
import { getDownloadURL } from 'firebase-admin/storage';
import { fileTypeFromBuffer } from 'file-type';
import { error } from '@sveltejs/kit';

export let firebaseAdmin = getFirebaseAdmin();

function getFirebaseAdmin() {
    let app: admin.app.App | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let firestore: Firestore | undefined = undefined;
    let bucket: Bucket | undefined = undefined;

    const setFirebaseApp = (incomingApp: admin.app.App) => {
        app = incomingApp;
    }

    const getFirebaseApp = (): admin.app.App => {
        if(app == undefined) { //this get reruns on every change durring preview, but firebase admin still sees the pervious instance made, so this just checks if we can use a previous firebase instance, otherwise it will cause an error because firebase thinks we are reintializing
            console.log( DEV == 'TRUE' ? "regetting" : undefined);
            if(DEV == 'TRUE') {
                if(admin.apps == null) {
                    app = admin.initializeApp({
                        credential: (admin.credential.cert(JSON.parse(ADMIN) as admin.ServiceAccount)),
                        storageBucket: 'frc-skywalkers.appspot.com'
                    }, "Server");
                } else if(admin.apps.length == 0) {
                    app = admin.initializeApp({
                        credential: (admin.credential.cert(JSON.parse(ADMIN) as admin.ServiceAccount)),
                        storageBucket: 'frc-skywalkers.appspot.com'
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
            } else {
                var found = false;
                for(var i = 0; i < admin.apps.length; i++) {
                    if(admin.apps[i] != null && (admin.apps[i] as admin.app.App).name == "firebase-frameworks") {
                        app = admin.apps[i] as admin.app.App;
                        found = true;
                    }
                }
                if(found == false) {
                    app = admin.initializeApp({ storageBucket: 'frc-skywalkers.appspot.com', credential: (admin.credential.cert(JSON.parse(ADMIN) as admin.ServiceAccount)) }, "firebase-frameworks");
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

    const getBucket = (): Bucket => {
        if(bucket == undefined) {
            bucket = getStorage(getFirebaseApp()).bucket();
        }

        return bucket;
    }

    return {
        getApp: getFirebaseApp,
        getAuth: getAuth,
        getFirestore: getFirestore,
        getBucket: getBucket,
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

function getFile(url: string): Promise<Stream.Transform> {
    return new Promise<Stream.Transform>(async (resolve, reject) => {
        try {
            const req = https.get(url, function (res) {
                const stream = new Stream.Transform();
    
                res.on('data', function (chunk) {
                    stream.push(chunk);
    
                    console.log(chunk);
                });
    
                res.on('close', function () {
                    resolve(stream);
                });
    
                res.on('end', function () {
                    resolve(stream);
                });
            });
    
            req.on('error', function(e) {
                console.log(e);
                req.destroy();
            });
        } catch(e) {
            reject(e);
        }  
    });
}

export async function getPhotoURL(url: string, id: string) {
    let photo;

    try {
        photo = (await getFile(url as string)).read();
    } catch(e) {
        console.log(e)
        throw error(501, "Failed to fetch profile picture.")
    }

    let info = (await fileTypeFromBuffer(photo));

    if(info == undefined) throw error(501, "Unable to determine profile picture file extension.");

    const ref = firebaseAdmin.getBucket().file(`users/${id}/profile.${info.ext}`);

    try {
        await ref.save(photo);
    } catch(e) {
        throw error(501, "Failed to upload profile picture.");
    }

    const photoURL = await getDownloadURL(ref);

    return photoURL;
}