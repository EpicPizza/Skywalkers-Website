import type { UserRecord } from 'firebase-admin/auth';
import type { FirestoreUser } from '$lib/Firebase/firebase';
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: UserRecord | undefined
			firestoreUser: FirestoreUser | undefined,
			team: boolean,
			kicked: boolean,
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
