import { goto, invalidateAll } from "$app/navigation";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { type Auth, getAuth as getFirebaseAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, browserLocalPersistence, initializeAuth, browserPopupRedirectResolver, type User, signInWithRedirect, signInWithPopup } from "firebase/auth";
import { get, writable, type Writable } from "svelte/store";
import { getFirestore as getFirebaseFirestore, type Firestore, type Unsubscribe, doc, getDoc, onSnapshot } from "firebase/firestore";
import { loading, verified } from "$lib/stores";
import { navigating } from "$app/stores";

export const client = firebaseClient();

interface Preload {
    photoURL: string | undefined,
    email: string | undefined,
    displayName: string | undefined,
    uid: string,
    preload: boolean,
    team: string | undefined,
    role: string | undefined,
}

export interface FirestoreUser {
    displayName: string,
    photoURL: string,
    role: string,
    team: string,
}

export interface SecondaryUser extends FirestoreUser {
    id: string,
}

export interface UndefinedFirestoreUser {
    role: undefined,
    team: undefined,
}

type VerifiedUser = FirestoreUser & User;
type NonverifiedUser = UndefinedFirestoreUser & User;

export function firebaseClient() {
    let app: FirebaseApp | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let user: Writable<NonverifiedUser | Preload | VerifiedUser | undefined> = writable(undefined);
    let provider: GoogleAuthProvider | undefined = undefined;
    let firestore: Firestore | undefined = undefined;
    let redirect: string | undefined = undefined;
    let unsubscribe: Unsubscribe | undefined = undefined;
    let cachedUsers: Map<string, SecondaryUser> = new Map();

    const getApp = (): FirebaseApp => {
        if(app == undefined) {
            const firebaseConfig = {
                apiKey: "AIzaSyBmGeT2iQZM1K7opC1Rcsjg1MRXTckVLmE",
                authDomain: "frc-skywalkers.firebaseapp.com",
                projectId: "frc-skywalkers",
                storageBucket: "frc-skywalkers.appspot.com",
                messagingSenderId: "86129312478",
                appId: "1:86129312478:web:b06670457b876827e1784f",
                measurementId: "G-GMZX3PY5H6"
            };
    
            app = initializeApp(firebaseConfig);
        }

        return app;
    }

    const getAuth = (): Auth => {
        if(auth == undefined) {
            auth = getFirebaseAuth(getApp());
        }

        return auth;
    }

    const getProvider = (): GoogleAuthProvider => {
        if(provider == undefined) {
            provider = new GoogleAuthProvider();
        }

        return provider;
    }

    const getFirestore = (): Firestore => {
        if(firestore == undefined) {
            firestore = getFirebaseFirestore();
        }

        return firestore;
    }

    const serverInit = (preload: Preload | undefined) => {
        if(preload == undefined) {
            user.set(undefined)
        } else {
            user.set(preload);
        }
    }

    const clientInit = () => {
        onAuthStateChanged(getAuth(), async (currentUser) => {
            if(currentUser == null && typeof get(user) == 'object') {
                user.set(undefined);

                if(redirect != undefined) {
                    console.log("REDIRECTING");
                    console.log("/");

                    await goto(redirect, {
                        invalidateAll: true,
                    });

                    redirect = undefined;
                } else {
                    invalidateAll();
                }
                
                return;
            } else if(currentUser == null && typeof get(user) == 'string') {
                const fetched = await fetch('/session/logout', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    }
                });

                user.set(undefined);

                invalidateAll();
            }

            if(currentUser != null && get(user) == undefined) {
                const token = await currentUser.getIdToken();

                const result = await fetch("/session/login", {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });

                const firestoreUser = await getFirestoreUser(currentUser.uid);

                if(firestoreUser == undefined) {
                    user.set({
                        ...currentUser,
                        role: undefined,
                        team: undefined
                    });
                } else {
                    user.set({
                        ...currentUser,
                        ...firestoreUser,
                    })
                }

                if(redirect != undefined) {
                    await goto(redirect, {
                        invalidateAll: true
                    });

                    redirect = undefined;
                } else {
                    invalidateAll();
                }
                loading.set(false);
            } else if(currentUser != null) {
                const firestoreUser = await getFirestoreUser(currentUser.uid);

                if(firestoreUser == undefined) {
                    user.set({
                        ...currentUser,
                        role: undefined,
                        team: undefined
                    });
                } else {
                    user.set({
                        ...currentUser,
                        ...firestoreUser,
                    })
                }

                loading.set(false);
            }
        })
    }

    const getFirestoreUser = async (id: string): Promise<FirestoreUser | undefined> => {
        const db = getFirestore();

        const userRef = doc(db, "users", id);
        const userData = (await getDoc(userRef)).data();

        if(unsubscribe != undefined) {
            unsubscribe();
        }

        unsubscribe = onSnapshot(userRef, (snapshot) => {
            if(snapshot.data() == undefined) { //means user was unverified, easiest way to handle unverfication is just to signout :/
                if(get(verified) == true) {
                    signOut();
                }
            } else {
                const currentUser = get(user);

                if(!(currentUser == undefined || 'prelaod' in currentUser)) { //prevents updates when user is signed out alr or website is still loading (preload exists)
                    user.set({
                        ...currentUser,
                        ...snapshot.data() as FirestoreUser,
                    })
                }
            }
        })

        return userData as FirestoreUser | undefined;
    }

    const signIn = async () => {
        getAuth().signOut();
        
        signInWithPopup(getAuth(), getProvider())
            .catch((error) => {
                if(error.code == "POPUP_BLOCKED" || error.message.includes("auth/popup-blocked")) {
                    signInWithRedirect(getAuth(), getProvider())
                        .catch((error) => {
                            console.log(error);
                        });
                } else {
                    console.log(error);
                }
            })
    }

    const signOut = async () => {
        const fetched = await fetch('/session/logout', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        });

        getAuth().signOut();
    }

    const reset = async () => {
        const fetched = await fetch('/session/reset', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        });

        getAuth().signOut();
    }

    const getUser = async (id: string): Promise<SecondaryUser | undefined> => {
        const cache = cachedUsers.get(id);

        if(cache != undefined) {
            return cache;
        } else {
            let currentUser = get(user);
            if(currentUser == undefined || 'preload' in currentUser || currentUser.team == undefined) {
                currentUser = await new Promise<VerifiedUser>((resolve) => {
                    user.subscribe((value) => {
                        if(value == undefined || 'preload' in value || value.team == undefined) return;

                        resolve(value);
                    })
                })
            }

            const db = getFirestore();

            const requestedUser = (await getDoc(doc(db, "users", id))).data();

            if(requestedUser == undefined) return undefined;

            return {
                ... requestedUser,
                id: id
            } as SecondaryUser;
        }
    }

    const cacheUser = (cachingUser: SecondaryUser) => {
        if(cachedUsers.get(cachingUser.id) == undefined) {
            cachedUsers.set(cachingUser.id, cachingUser);
        }
        console.log("Cached Users", cachedUsers);
    }

    $: console.log("Cached Users", cachedUsers);

    return {
        subscribe: user.subscribe,
        set: user.set,
        update: user.update,
        clientInit: clientInit,
        signIn: signIn,
        signOut: signOut,
        reset: reset,
        serverInit: serverInit,
        setRedirect: (value: string) => { redirect = value; },
        getFirestore: getFirestore,
        getApp: getApp,
        cacheUser: cacheUser,
        getUser: getUser,
    }
}