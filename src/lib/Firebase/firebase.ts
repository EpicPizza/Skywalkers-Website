import { goto, invalidateAll } from "$app/navigation";
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  type Auth,
  getAuth as getFirebaseAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  browserLocalPersistence,
  initializeAuth,
  browserPopupRedirectResolver,
  type User,
  signInWithRedirect,
  signInWithPopup,
} from "firebase/auth";
import { get, writable, type Unsubscriber, type Writable } from "svelte/store";
import {
  getFirestore as getFirebaseFirestore,
  type Firestore,
  type Unsubscribe,
  doc,
  getDoc,
  onSnapshot,
  DocumentReference,
} from "firebase/firestore";
import { createVerified } from "$lib/stores";
import { navigating, page } from "$app/stores";
import type { Role } from "$lib/Roles/role";
import { browser } from "$app/environment";

interface Preload {
  photoURL: string | undefined;
  email: string | undefined;
  displayName: string | undefined;
  uid: string;
  preload: boolean;
  pronouns: string | undefined;
  teams: Teams | undefined;
}

export type Teams = {
  team: string;
  role: string;
  permissions: string[];
  level: number;
  roles: Role[];
}[];

export interface FirestoreUser {
  displayName: string;
  photoURL: string;
  pronouns: string;
  teams: Teams;
}

export interface MainUser extends FirestoreUser {
  permissions: string[];
}

export interface SecondaryUser extends FirestoreUser {
  id: string;
}

export interface UndefinedFirestoreUser {
  pronouns: undefined;
  teams: undefined;
}

export type VerifiedUser = MainUser & User;
type NonverifiedUser = UndefinedFirestoreUser & User;

export function firebaseClient() {
  let app: FirebaseApp | undefined = undefined;
  let auth: Auth | undefined = undefined;
  let user: Writable<NonverifiedUser | Preload | VerifiedUser | undefined> =
    writable(undefined);
  let provider: GoogleAuthProvider | undefined = undefined;
  let firestore: Firestore | undefined = undefined;
  let unsubscribe: Unsubscribe | undefined = undefined;
  let cachedUsers: Map<string, SecondaryUser | { teams: undefined }> =
    new Map();
  let cachedRoles: Map<{ id: string; team: string }, Role | { id: undefined }> =
    new Map();
  let firestoreEntry: any | undefined = undefined;
  let leaving;

  const getApp = (): FirebaseApp => {
    if (!browser) return undefined as any;

    if (app == undefined) {
      const firebaseConfig = {
        apiKey: "AIzaSyBmGeT2iQZM1K7opC1Rcsjg1MRXTckVLmE",
        authDomain: "skywalkers.alexest.net",
        projectId: "frc-skywalkers",
        storageBucket: "frc-skywalkers.appspot.com",
        messagingSenderId: "86129312478",
        appId: "1:86129312478:web:b06670457b876827e1784f",
        measurementId: "G-GMZX3PY5H6",
      };

      app = initializeApp(firebaseConfig);
    }

    return app;
  };

  const getAuth = (): Auth => {
    if (auth == undefined) {
      auth = getFirebaseAuth(getApp());
    }

    return auth;
  };

  const getAuthUser = (): ReturnType<typeof getAuth>["currentUser"] | null => {
    return getAuth().currentUser;
  };

  const getFirestoreEntry = (): any => {
    return firestoreEntry;
  };

  const getProvider = (): GoogleAuthProvider => {
    if (provider == undefined) {
      provider = new GoogleAuthProvider();
    }

    return provider;
  };

  const getFirestore = (): Firestore => {
    if (firestore == undefined) {
      firestore = getFirebaseFirestore(getApp());
    }

    return firestore;
  };

  const serverInit = (preload: Preload | undefined) => {
    if (preload == undefined) {
      user.set(undefined);
    } else {
      user.set(preload);
    }
  };

  const clientInit = (loading: Writable<boolean>) => {
    onAuthStateChanged(getAuth(), async (currentUser) => {
      if (
        currentUser == null &&
        get(user) != undefined &&
        !("preload" in (get(user) as any))
      ) {
        user.set(undefined);

        invalidateAll();

        return;
      } else if (
        currentUser == null &&
        get(user) != undefined &&
        "preload" in (get(user) as any)
      ) {
        await fetch("/session/logout", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
        });

        user.set(undefined);

        invalidateAll();
      }

      if (currentUser != null && get(user) == undefined) {
        const token = await currentUser.getIdToken();

        const result = await fetch("/session/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (result.status == 401) {
          signOut();
          return;
        }

        const firestoreUser = await getFirestoreUser(currentUser.uid);

        if (firestoreUser == undefined) {
          user.set({
            ...currentUser,
            teams: undefined,
            pronouns: undefined,
          });
        } else {
          user.set({
            ...currentUser,
            ...firestoreUser,
          });
        }

        invalidateAll();

        loading.set(false);
      } else if (currentUser != null) {
        const firestoreUser = await getFirestoreUser(currentUser.uid);

        if (firestoreUser == undefined) {
          user.set({
            ...currentUser,
            teams: undefined,
            pronouns: undefined,
          });
        } else {
          user.set({
            ...currentUser,
            ...firestoreUser,
          });
        }

        loading.set(false);
      }
    });
  };

  const getFirestoreUser = async (
    id: string,
  ): Promise<MainUser | undefined> => {
    const db = getFirestore();

    const userRef = doc(db, "users", id);
    let userData;
    try {
      userData = (await getDoc(userRef)).data();
    } catch (e) {
      console.log(e);
      userData == undefined;
      return;
    }

    if (unsubscribe != undefined) {
      unsubscribe();
    }

    unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.data() == undefined) {
        //means user was unverified, easiest way to handle unverfication is just to signout :/
        let currentUser = get(user);
        if (currentUser != undefined && currentUser.teams) {
          signOut();
        }
      } else {
        if (get(user)?.teams) {
          invalidateAll();
        }

        const currentUser = get(user);

        if (!(currentUser == undefined || "preload" in currentUser)) {
          //prevents updates when user is signed out alr or website is still loading (preload exists)
          firestoreEntry = snapshot.data();

          let permissions = [];

          if (firestoreEntry) {
            for (let i = 0; i < firestoreEntry.teams.length; i++) {
              if (firestoreEntry.teams[i].team == get(page).params.team) {
                permissions = firestoreEntry.teams[i].permissions;
              }

              firestoreEntry.teams[i].roles = await getSpecifiedRoles(
                firestoreEntry.teams[i].roles as DocumentReference[],
                firestoreEntry.teams[i].team,
              );
            }
          }

          user.set({
            ...currentUser,
            ...(firestoreEntry as FirestoreUser),
            permissions,
          } as VerifiedUser);
        }
      }
    });

    let backup = get(user); //no way to get roles at this point, will have to sacriface

    let permissions: string[] = [];

    if (userData && backup && backup.teams) {
      for (let i = 0; i < userData.teams.length; i++) {
        if (userData.teams[i].team == get(page).params.team) {
          permissions = userData.teams[i].permissions;
        }

        const team = userData.teams[i].team;

        for (let j = 0; j < backup.teams.length; j++) {
          if (backup.teams[j].team == team) {
            userData.teams[i].roles = backup.teams[j].roles;
          }
        }
      }
    }

    return userData
      ? ({
          ...userData,
          permissions,
        } as MainUser)
      : undefined;
  };

  const signIn = async () => {
    getAuth().signOut();

    signInWithRedirect(getAuth(), getProvider()).catch((error) => {
      console.log(error);
    });
  };

  const signOut = async () => {
    await fetch("/session/logout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    cachedUsers = new Map();
    cachedRoles = new Map();

    getAuth().signOut();
  };

  const reset = async () => {
    await fetch("/session/reset", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });

    getAuth().signOut();
  };

  const getUser = async (
    id: string,
    refresh = false,
  ): Promise<SecondaryUser | undefined> => {
    const cache = cachedUsers.get(id);

    if (cache != undefined && !refresh) {
      if (cache.teams == undefined) {
        return undefined;
      } else {
        let currentUser = get(user);
        if (
          currentUser == undefined ||
          "preload" in currentUser ||
          currentUser.teams == undefined
        ) {
          currentUser = await new Promise<VerifiedUser>((resolve) => {
            user.subscribe((value) => {
              if (
                value == undefined ||
                "preload" in value ||
                value.teams == undefined
              )
                return;

              resolve(value);
            });
          });
        }

        const inTeams = Array.from(currentUser.teams, (team) => team.team);

        for (let i = 0; i < cache.teams.length; i++) {
          if (inTeams.includes(cache.teams[i].team)) {
            cache.teams[i].roles = await getSpecifiedRoles(
              cache.teams[i].roles as unknown as DocumentReference[],
              cache.teams[i].team,
            );
          }
        }

        cacheUser(id, cache as SecondaryUser);

        return cache;
      }
    } else {
      let currentUser = get(user);
      if (
        currentUser == undefined ||
        "preload" in currentUser ||
        currentUser.teams == undefined
      ) {
        currentUser = await new Promise<VerifiedUser>((resolve) => {
          user.subscribe((value) => {
            if (
              value == undefined ||
              "preload" in value ||
              value.teams == undefined
            )
              return;

            resolve(value);
          });
        });
      }

      const db = getFirestore();

      const ref = doc(db, "users", id);

      let requestedUser;
      try {
        requestedUser = (await getDoc(ref)).data();
      } catch (e: any) {
        if (e.message == "Missing or insufficient permissions.") {
          cacheUser(id, { teams: undefined });
        } else {
          console.error(e);
        }
        return undefined;
      }

      if (requestedUser == undefined) return undefined;

      const inTeams = Array.from(currentUser.teams, (team) => team.team);

      for (let i = 0; i < requestedUser.teams.length; i++) {
        if (inTeams.includes(requestedUser.teams[i].team)) {
          requestedUser.teams[i].roles = await getSpecifiedRoles(
            requestedUser.teams[i].roles as DocumentReference[],
            requestedUser.teams[i].team,
          );
        }
      }

      cacheUser(id, {
        ...requestedUser,
        id: id,
      } as SecondaryUser);

      return {
        ...requestedUser,
        id: id,
      } as SecondaryUser;
    }
  };

  const cacheUser = (
    id: string,
    cachingUser: SecondaryUser | { teams: undefined },
  ) => {
    if (cachedUsers.get(id) == undefined) {
      cachedUsers.set(id, cachingUser);
    }
  };

  const getRole = async (
    id: string,
    team: string,
  ): Promise<Role | undefined> => {
    if (!browser) return;
    if (id == "") return;

    const cache = cachedRoles.get({ id: id, team: team });

    if (cache != undefined) {
      if (cache.id == undefined) {
        return undefined;
      } else {
        return cache;
      }
    } else {
      let currentUser = get(user);

      if (
        currentUser == undefined ||
        "preload" in currentUser ||
        currentUser.teams == undefined
      ) {
        currentUser = await new Promise<VerifiedUser>((resolve) => {
          user.subscribe((value) => {
            if (
              value == undefined ||
              "preload" in value ||
              value.teams == undefined
            )
              return;

            resolve(value);
          });
        });
      }

      const db = getFirestore();

      const ref = doc(db, "teams", team, "roles", id);

      let requestedRole;
      try {
        requestedRole = (await getDoc(ref)).data();
      } catch (e: any) {
        if (e.message == "Missing or insufficient permissions.") {
          cacheRole(id, team, { id: undefined });
        } else {
          console.error(e);
        }
        return undefined;
      }

      if (requestedRole == undefined) return undefined;

      cacheRole(id, team, {
        ...requestedRole,
        members: [] as any,
        id: id,
      } as Role);

      return {
        ...requestedRole,
        members: [] as any,
        id: id,
      } as Role;
    }
  };

  const cacheRole = (
    id: string,
    team: string,
    cachingRole: Role | { id: undefined },
  ) => {
    cachedRoles.set({ id, team }, cachingRole);
  };

  const getSpecifiedRoles = async (refs: DocumentReference[], team: string) => {
    const roles = new Array<Role>();

    for (let i = 0; i < refs.length; i++) {
      const role = await getRole(refs[i].id, team);

      if (role != undefined) {
        roles.push(role);
      }
    }

    return roles;
  };

  const docStore = <T>(docRef: DocumentReference, initial: any = undefined) => {
    let unsubscribe: Unsubscribe | undefined;
    let unsubscribeUser: Unsubscriber | undefined;

    const { subscribe } = writable<T | undefined>(initial, (set) => {
      unsubscribeUser = user.subscribe((currentUser) => {
        if (
          currentUser == undefined ||
          "preload" in currentUser ||
          currentUser.teams == undefined
        )
          return;

        if (unsubscribe) unsubscribe();

        unsubscribe = onSnapshot(docRef, (snapshot) => {
          set((snapshot.data() as T) ?? undefined);
        });
      });

      return () => {
        if (unsubscribe) unsubscribe();
        if (unsubscribeUser) unsubscribeUser();
      };
    });

    return {
      subscribe,
      ref: docRef,
      id: docRef.id,
    };
  };

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
    getUser: getUser,
    getRole: getRole,
  };
}
