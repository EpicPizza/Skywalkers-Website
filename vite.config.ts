import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodeLoaderPlugin } from "@vavite/node-loader/plugin"

export default defineConfig(({ mode }) => {
    let plugins = [sveltekit()] as any;
    if (mode === 'development') {
        plugins = [nodeLoaderPlugin(), ...plugins];
    }

    return {
        // ... your code ...
        plugins,
		build: {
			rollupOptions: {
				external: ["firebase-admin", "gaxios", "node-fetch"]
			},
		},
    };
})