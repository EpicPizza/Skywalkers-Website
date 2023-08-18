import firebase from "svelte-adapter-firebase";
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: firebase(),
		csrf: {
			checkOrigin: true,
		},
		csp: {
            directives: {
                'script-src': ['self', "https://apis.google.com"],
				'style-src': ['self', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'unsafe-inline'],
				'img-src': ['self', 'https://lh3.googleusercontent.com/', 'https://firebasestorage.googleapis.com/v0/b/frc-skywalkers.appspot.com/'],
				'connect-src': ['self', 'https://identitytoolkit.googleapis.com/', 'https://firestore.googleapis.com/', 'https://securetoken.googleapis.com/', 'https://firebasestorage.googleapis.com/v0/b/frc-skywalkers.appspot.com/'],
				'font-src': ['self', 'https://fonts.gstatic.com/'],
				'frame-src': ['self', 'https://frc-skywalkers.firebaseapp.com/'],
				'default-src': ['self'],
            },
        }
	}
};

export default config;
