import type { UserRecord } from 'firebase-admin/auth';
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: UserRecord | null
			team: boolean,
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
