import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		rollupOptions: {
			external: ["firebase-admin"]
		}
	},
	server: {
        proxy: {
            '/__/auth': 'https://skywalkers-operations-373322.firebaseapp.com',
        },
    },
});
