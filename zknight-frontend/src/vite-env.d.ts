/// <reference types="vite/client" />

// Injected by vite.config.ts → define.__WORKER_VERSION__
// Baked in at build time as a Unix timestamp string.
// Used to cache-bust public/prove.worker.js on each deploy.
declare const __WORKER_VERSION__: string;
