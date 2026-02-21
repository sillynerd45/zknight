import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Load .env files from the parent directory (repo root)
  envDir: '..',
  define: {
    global: 'globalThis',
    // Baked in at build time — used to cache-bust prove.worker.js on each deploy.
    // public/ files bypass Vite's content-hash fingerprinting, so we add ?v=<timestamp>
    // to the Worker URL manually. Every new build gets a new timestamp → new cache key.
    __WORKER_VERSION__: JSON.stringify(Date.now().toString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: path.resolve(__dirname, './node_modules/buffer/')
    },
    dedupe: ['@stellar/stellar-sdk']
  },
  optimizeDeps: {
    include: ['@stellar/stellar-sdk', '@stellar/stellar-sdk/contract', '@stellar/stellar-sdk/rpc', 'buffer'],
    needsInterop: ['@stellar/stellar-sdk', '@stellar/stellar-sdk/contract', '@stellar/stellar-sdk/rpc'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
