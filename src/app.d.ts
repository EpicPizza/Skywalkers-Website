import type { UserRecord } from "firebase-admin/auth";
import type { FirestoreUser } from "$lib/Firebase/firebase";
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: UserRecord | undefined;
      firestoreUser: FirestoreUser | undefined;
      permissions: string[];
      level: number;
      team: null | string;
      kicked: boolean;
      unverifiedTeam: null | string;
      teamInfo: Map<string, { name: string; website: string; icon: string }>;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
