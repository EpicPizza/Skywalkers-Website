import { preprocessMeltUI } from "@melt-ui/pp";
import sequence from "svelte-sequential-preprocessor";
import firebase from "svelte-adapter-firebase";
import { vitePreprocess } from "@sveltejs/kit/vite";
import csp from './csp_dev.json' assert { type: "json" };
import dsv from "@rollup/plugin-dsv";
/** @type {import('@sveltejs/kit').Config}*/
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: firebase(),
    csrf: {
      checkOrigin: true,
    },
    csp: {
      directives: csp.directives,
    },
  },
};
export default config;
