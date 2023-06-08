import { goto, invalidateAll } from "$app/navigation";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { type Auth, getAuth as getFirebaseAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, browserLocalPersistence, initializeAuth, browserPopupRedirectResolver, type User, signInWithRedirect, signInWithPopup } from "firebase/auth";
import { get, writable, type Writable } from "svelte/store";
import { getFirestore as getFirebaseFirestore, type Firestore } from "firebase/firestore";
import { loading } from "$lib/stores";
import { navigating } from "$app/stores";

export const client = firebaseClient();

interface Preload {
    photoURL: string | undefined,
    email: string | undefined,
    displayName: string | undefined,
    uid: string,
    preload: boolean,
}

function firebaseClient() {
    let app: FirebaseApp | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let user: Writable<User | Preload | undefined> = writable(undefined);
    let provider: GoogleAuthProvider | undefined = undefined;
    let firestore: Firestore | undefined = undefined;
    let redirect: string | undefined = undefined;

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
            console.log(currentUser);
            console.log(get(user));

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

                user.set(currentUser);

                if(redirect != undefined) {
                    await goto(redirect);

                    await invalidateAll();

                    redirect = undefined;
                } else {
                    invalidateAll();
                }
                loading.set(false);
            } else if(currentUser != null) {
                loading.set(false);

                user.set(currentUser);
            }
        })
    }

    const signIn = async () => {
        /*const fetched = await fetch('/session/logout', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        });

        signOut();

        user.set(undefined);*/

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
    }
}