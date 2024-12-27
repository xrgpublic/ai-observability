import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: process.env.DOCKER_ENV ? '0.0.0.0' : '127.0.0.1', // Bind to 0.0.0.0 for docker
    port: 5173, // Your desired port
},
})
