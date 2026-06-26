import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Project pages are served under https://<user>.github.io/<repo>/, so the app
// needs a base path in production. BASE_PATH is set by the deploy workflow.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // SPA: emit a single client-rendered shell (the app uses an in-memory store).
    adapter: adapter({ fallback: 'index.html' }),
    paths: { base }
  }
};

export default config;
