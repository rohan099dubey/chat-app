import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- Add this optimizeDeps configuration ---
  optimizeDeps: {
    exclude: ['tailwindcss/version.js'] // Tell esbuild to ignore this specific import
  }
  // --- End Add ---
})