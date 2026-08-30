import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Provides real Node globals (Buffer, process, etc.) that Solana's
    // libraries assume exist, at the bundler level — this runs before
    // any module's own top-level code, unlike a manual
    // `window.Buffer = Buffer` inside main.tsx, which only helps once
    // ES module import hoisting has already evaluated everything else
    // first (that's why the manual polyfill kept failing).
    nodePolyfills({
      include: ['buffer'],
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
})