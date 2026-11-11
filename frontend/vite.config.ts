/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simule un navigateur (document, boutons, champs) pour les tests.
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
