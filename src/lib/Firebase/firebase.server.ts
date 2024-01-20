import admin from 'firebase-admin'
import { ADMIN, DEV, OWNER, PROD_ADMIN } from '$env/static/private';
import FirebaseAdmin from 'firebase-admin';
const firebaseAuth = FirebaseAdmin.auth;
import type { Auth, DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { AuthCredential } from 'firebase/auth';
import { type Firestore, getFirestore as getFirebaseFirestore, DocumentReference, Transaction, type DocumentData } from 'firebase-admin/firestore';
import { getSpecifiedRoles } from '$lib/Roles/role.server';
import type { FirestoreUser, SecondaryUser } from './firebase';
import type { Storage } from 'firebase-admin/lib/storage/storage';
import { getStorage } from 'firebase-admin/storage';
import Stream from 'stream';
import * as https from 'https';
import path from 'path';
import { getDownloadURL } from 'firebase-admin/storage';
import { fileTypeFromBuffer } from 'file-type';
import { error } from '@sveltejs/kit';
import { getCalendar, getClient, getClientWithCrendentials } from '$lib/Google/client';
import { editEvent, getEvent } from '$lib/Google/calendar';
import { sendDM } from '$lib/Discord/discord.server';
import editAttendees from '../../calendarEvents/code';

export let firebaseAdmin = getFirebaseAdmin();

function getFirebaseAdmin() {
    let app: admin.app.App | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let firestore: Firestore | undefined = undefined;
    let bucket: ReturnType<(ReturnType<typeof getStorage>["bucket"])> | undefined = undefined;
    let interval: NodeJS.Timeout | undefined = undefined; 
    let prodApp: admin.app.App | undefined = undefined;

    const setFirebaseApp = (incomingApp: admin.app.App) => {
        app = incomingApp;
    }

    const getFirebaseApp = (prod = false): admin.app.App => {
        if(prod && DEV == 'TRUE') {
            if(prodApp == undefined) {
                var found = false;
                for(var i = 0; i < admin.apps.length; i++) {
                    if(admin.apps[i] != null && (admin.apps[i] as admin.app.App).name == "Server-Prod") {
                        prodApp = admin.apps[i] as admin.app.App;
                        found = true;
                    }
                }
                if(found == false) {
                    prodApp = admin.initializeApp({
                        credential: (admin.credential.cert(JSON.parse(PROD_ADMIN) as admin.ServiceAccount)),
                        storageBucket: 'frc-skywalkers.appspot.com'
                    }, "Server-Prod");
                }
            }

            return prodApp as admin.app.App;
        }

        if(app == undefined) { //this get reruns on every change durring preview, but firebase admin still sees the pervious instance made, so this just checks if we can use a previous firebase instance, otherwise it will cause an error because firebase thinks we are reintializing
            console.log( DEV == 'TRUE' ? "regetting" : undefined);
            if(DEV == 'TRUE') {
                if(admin.apps == null) {
                    app = admin.initializeApp({
                        credential: (admin.credential.cert(JSON.parse(ADMIN) as admin.ServiceAccount)),
                        storageBucket: 'frc-skywalkers-dev.appspot.com'
                    }, "Server");
                } else if(admin.apps.length == 0) {
                    app = admin.initializeApp({
                        credential: (admin.credential.cert(JSON.parse(ADMIN) as admin.ServiceAccount)),
                        storageBucket: 'frc-skywalkers-dev.appspot.com'
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
                if(admin.apps == null) {
                    app = admin.initializeApp({ storageBucket: 'frc-skywalkers.appspot.com' }, "Server");
                } else if(admin.apps.length == 0) {
                    app = admin.initializeApp({ storageBucket: 'frc-skywalkers.appspot.com' }, "Server");
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

    const getBucket = (): ReturnType<(ReturnType<typeof getStorage>["bucket"])> => {
        if(bucket == undefined) {
            bucket = getStorage(getFirebaseApp()).bucket();
        }

        return bucket;
    }

    const addLog = async (content: string, icon: string, id: string) => {
        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('logs');

        await ref.add({
            content,
            icon,
            id,
            timestamp: new Date(),
        })
    }

    const addLogWithTransaction = (content: string, icon: string, id: string, transaction: Transaction, team: string) => {
        const db = firebaseAdmin.getFirestore();

        const ref = db.collection('logs');

        const doc = crypto.randomUUID();

        transaction.create(ref.doc(doc), {
            content,
            icon,
            id,
            timestamp: new Date(),
            team,
        })
    }

    return {
        getApp: getFirebaseApp,
        getAuth: getAuth,
        getFirestore: getFirestore,
        getBucket: getBucket,
        addLog: addLog,
        addLogWithTransaction: addLogWithTransaction,
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
        console.log(e);

        throw error(501, "Failed to upload profile picture.");
    }

    const photoURL = await getDownloadURL(ref);

    return photoURL;
}

async function initFirstore(firestore: Firestore) {
    const ref = firestore.collection('teams').doc('111111').collection('meetings'); //fine since just in development

    ref.onSnapshot(async snapshot => {
        console.log("checking for calendar events")

        const docs = Array.from(snapshot.docChanges(), change => (change.type == 'modified' ? change.doc : undefined ));

        console.log(docs);

        for(let i = 0; i < docs.length; i++) {
            const doc = docs[i];

            if(!doc || !doc.exists || doc.data() == undefined) continue;

            await editAttendees(doc.data());
        }
    })
}