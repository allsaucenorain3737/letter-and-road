#!/usr/bin/env node
/**
 * Bundle MapLibre's module worker + shared chunk into a single classic-worker
 * file at public/maplibre-gl-worker.cjs. MapLibre uses classic workers for
 * URLs ending in .cjs (no type:"module"), which avoids Vite injecting
 * /@vite/client into the worker during `vite dev`.
 */
import { build } from 'vite'
import { mkdirSync, renameSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'tmp/maplibre-worker-build')
const dest = join(root, 'public/maplibre-gl-worker.cjs')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

await build({
  configFile: false,
  root,
  logLevel: 'warn',
  build: {
    outDir,
    emptyOutDir: true,
    write: true,
    lib: false,
    rollupOptions: {
      input: join(root, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'),
      output: {
        entryFileNames: 'maplibre-gl-worker.cjs',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    target: 'es2019',
    minify: false,
  },
  worker: { format: 'es' },
})

const built = join(outDir, 'maplibre-gl-worker.cjs')
if (!existsSync(built)) {
  console.error('sync-maplibre-worker: build output missing', built)
  process.exit(1)
}
mkdirSync(dirname(dest), { recursive: true })
renameSync(built, dest)
rmSync(outDir, { recursive: true, force: true })
console.log('Wrote', dest)
