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
                apiKey: "AIzaSyDGM8cQ5m8Cnbbdf5N9iKdKs9ZWbDsyOq8",
                authDomain: "skywalkers-operations-373322.firebaseapp.com",
                projectId: "skywalkers-operations-373322",
                storageBucket: "skywalkers-operations-373322.appspot.com",
                messagingSenderId: "688324481368",
                appId: "1:688324481368:web:89bec25378bef4cda7952d"
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

                invalidateAll();
                
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
                    loading.set(false);
                    redirect = undefined;
                } else {
                    invalidateAll();
                }
            } else if(currentUser != null) {
                user.set(currentUser);
            }
        })
    }

    const signIn = async () => {
        const fetched = await fetch('/session/logout', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        });

        signOut();

        user.set(undefined);
        
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