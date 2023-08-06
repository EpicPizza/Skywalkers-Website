import { goto, invalidateAll } from "$app/navigation";
import { initializeApp, type FirebaseApp } from "firebase/app";
import { type Auth, getAuth as getFirebaseAuth, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, browserLocalPersistence, initializeAuth, browserPopupRedirectResolver, type User, signInWithRedirect, signInWithPopup } from "firebase/auth";
import { get, writable, type Unsubscriber, type Writable } from "svelte/store";
import { getFirestore as getFirebaseFirestore, type Firestore, type Unsubscribe, doc, getDoc, onSnapshot, DocumentReference } from "firebase/firestore";
import { createVerified } from "$lib/stores";
import { navigating } from "$app/stores";
import type { Role } from "$lib/Roles/role";
import { getContext } from "svelte";
import { browser } from "$app/environment";

interface Preload {
    photoURL: string | undefined,
    email: string | undefined,
    displayName: string | undefined,
    uid: string,
    preload: boolean,
    pronouns: string | undefined,
    team: string | undefined,
    role: string | undefined,
    permissions: string[] | undefined,
    level: number | undefined,
    roles: Role[] | undefined,
}

export interface FirestoreUser {
    displayName: string,
    permissions: string[],
    level: number;
    photoURL: string,
    role: string,
    team: string,
    pronouns: string,
    roles: Role[]
}

export interface SecondaryUser extends FirestoreUser {
    id: string,
}

export interface UndefinedFirestoreUser {
    role: undefined,
    team: undefined,
    pronouns: undefined,
    permissions: undefined,
    level: undefined,
    roles: undefined,
}

export type VerifiedUser = FirestoreUser & User;
type NonverifiedUser = UndefinedFirestoreUser & User;

export function firebaseClient() {
    let app: FirebaseApp | undefined = undefined;
    let auth: Auth | undefined = undefined;
    let user: Writable<NonverifiedUser | Preload | VerifiedUser | undefined> = writable(undefined);
    let provider: GoogleAuthProvider | undefined = undefined;
    let firestore: Firestore | undefined = undefined;
    let unsubscribe: Unsubscribe | undefined = undefined;
    let cachedUsers: Map<string, SecondaryUser | { team: undefined }> = new Map();
    let cachedRoles: Map<string, Role | { id: undefined } > = new Map();
    let firestoreEntry: any | undefined = undefined;

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

    const getAuthUser = (): (ReturnType<typeof getAuth>)["currentUser"] | null => {
        return getAuth().currentUser;
    }

    const getFirestoreEntry = (): any => {
        return firestoreEntry;
    }

    const getProvider = (): GoogleAuthProvider => {
        if(provider == undefined) {
            provider = new GoogleAuthProvider();
        }

        return provider;
    }

    const getFirestore = (): Firestore => {
        if(firestore == undefined) {
            firestore = getFirebaseFirestore(getApp());
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

    const clientInit = (loading: Writable<boolean>) => {
        onAuthStateChanged(getAuth(), async (currentUser) => {
            if(currentUser == null && get(user) != undefined && !('preload' in (get(user) as any))) {
                user.set(undefined);

                invalidateAll();
                
                return;
            } else if(currentUser == null && get(user) != undefined && 'preload' in (get(user) as any)) {
                await fetch('/session/logout', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    }
                });

                user.set(undefined);

                console.log("INVALIDATED");

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

                if(result.status == 401) {
                    signOut();
                    return;
                }

                const firestoreUser = await getFirestoreUser(currentUser.uid);

                if(firestoreUser == undefined) {
                    user.set({
                        ...currentUser,
                        role: undefined,
                        team: undefined,
                        pronouns: undefined,
                        roles: undefined,
                        level: undefined,
                        permissions: undefined,
                    });
                } else {
                    user.set({
                        ...currentUser,
                        ...firestoreUser,
                    })
                }

                invalidateAll();

                loading.set(false);
            } else if(currentUser != null) {
                const firestoreUser = await getFirestoreUser(currentUser.uid);

                if(firestoreUser == undefined) {
                    user.set({
                        ...currentUser,
                        role: undefined,
                        team: undefined,
                        pronouns: undefined,
                        roles: undefined,
                        level: undefined,
                        permissions: undefined,
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
        console.log(userRef.path);
        let userData;
        try {
            userData = (await getDoc(userRef)).data();
        } catch(e) {
            console.log(e);
            userData == undefined;
            return;
        }

        if(unsubscribe != undefined) {
            unsubscribe();
        }

        unsubscribe = onSnapshot(userRef, async (snapshot) => {
            if(snapshot.data() == undefined) { //means user was unverified, easiest way to handle unverfication is just to signout :/
                let currentUser = get(user);
                if(currentUser != undefined && currentUser.team != undefined) {
                    signOut();
                    console.log("SIGNED OUT");
                }
            } else {
                if(get(user)?.team == undefined) {
                    invalidateAll();
                }

                const currentUser = get(user);

                if(!(currentUser == undefined || 'prelaod' in currentUser)) { //prevents updates when user is signed out alr or website is still loading (preload exists)
                    firestoreEntry = snapshot.data();

                    user.set({
                        ...currentUser,
                        ...{
                            ...snapshot.data(),
                            roles: snapshot.data() ? await getSpecifiedRoles(snapshot.data()?.roles as DocumentReference[]) : [],
                        } as FirestoreUser
                    })
                }
            }
        })

        return userData ? {
            ...userData,
            roles: get(user) ? get(user)?.roles : [], //this gets run before user object is updated and getSpecifiedRoles waits until user object is updated, which causes website to get stuck in a promise loop waiting for each other :/
        } as FirestoreUser : undefined;
    }

    const signIn = async () => {
        getAuth().signOut();
    

        signInWithRedirect(getAuth(), getProvider())
            .catch((error) => {
                console.log(error);
            });
    }

    const signOut = async () => {
        await fetch('/session/logout', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            }
        });

        getAuth().signOut();
    }

    const reset = async () => {
        await fetch('/session/reset', {
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
            if(cache.team == undefined) {
                return undefined;
            } else {
                return cache;
            }
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

            const ref = doc(db, "users", id);

            let requestedUser;
            try {
                requestedUser = (await getDoc(ref)).data();
            } catch(e: any) {
                if(e.message == "Missing or insufficient permissions.") {
                    cacheUser(id, { team: undefined });
                } else {
                    console.error(e);
                }
                return undefined;
            }

            if(requestedUser == undefined) return undefined;
            
            cacheUser(id, {
                ... requestedUser,
                roles: await getSpecifiedRoles(requestedUser.roles as DocumentReference[]),
                id: id
            } as SecondaryUser);

            return {
                ... requestedUser,
                roles: await getSpecifiedRoles(requestedUser.roles as DocumentReference[]),
                id: id
            } as SecondaryUser;
        }
    }

    const cacheUser = (id: string, cachingUser: SecondaryUser | { team: undefined }) => {
        if(cachedUsers.get(id) == undefined) {
            cachedUsers.set(id, cachingUser);
        }
    }

    const getRole = async (id: string): Promise<Role | undefined> => {
        if(!browser) return;
        if(id == "") return;

        const cache = cachedRoles.get(id);

        if(cache != undefined) {
            if(cache.id == undefined) {
                return undefined;
            } else {
                return cache;
            }
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

            const ref = doc(db, "teams", currentUser.team, "roles", id);

            let requestedRole;
            try {
                requestedRole = (await getDoc(ref)).data();
            } catch(e: any) {
                if(e.message == "Missing or insufficient permissions.") {
                    cacheRole(id, { id: undefined });
                } else {
                    console.error(e);
                }
                return undefined;
            }

            if(requestedRole == undefined) return undefined;
            
            cacheRole(id, {
                ... requestedRole,
                members: [] as any,
                id: id
            } as Role);

            return  {
                ... requestedRole,
                members: [] as any,
                id: id
            } as Role;
        }
    }

    const cacheRole = (id: string, cachingRole: Role | { id: undefined }) => {
        if(cachedRoles.get(id) == undefined) {
            cachedRoles.set(id, cachingRole);
        }
    }

    const getSpecifiedRoles = async (refs: DocumentReference[]) => {
        const roles = new Array<Role>();

        for(let i = 0; i < refs.length; i++) {
            const role = await getRole(refs[i].id);
    
            if(role != undefined) {
                roles.push(role);
            }
        }
    
        return roles;
    }

    const docStore = <T>( docRef: DocumentReference, initial: any = undefined) => {
        let unsubscribe: Unsubscribe | undefined;
        let unsubscribeUser: Unsubscriber | undefined;

        const { subscribe } = writable<T | undefined>(initial, (set) => {
            unsubscribeUser = user.subscribe((currentUser) => {
                if(currentUser == undefined || 'preload' in currentUser || currentUser.team == undefined) return;

                if(unsubscribe) unsubscribe();

                unsubscribe = onSnapshot(docRef, (snapshot) => {
                    set((snapshot.data() as T) ?? undefined);
                });
            })

            return () => {
                if(unsubscribe) unsubscribe();
                if(unsubscribeUser) unsubscribeUser();
            }
        })

        return {
            subscribe,
            ref: docRef,
            id: docRef.id,
        }
    }

    return {
        subscribe: user.subscribe,
        set: user.set,
        doc: docStore,
        update: user.update,
        clientInit: clientInit,
        signIn: signIn,
        signOut: signOut,
        reset: reset,
        serverInit: serverInit,
        getFirestore: getFirestore,
        getApp: getApp,
        debug: {
            getUser: getAuthUser,
            getEntry: getFirestoreEntry,
        },
        cacheUser: cacheUser,
        getUser: getUser,
        getRole: getRole,
    }
}