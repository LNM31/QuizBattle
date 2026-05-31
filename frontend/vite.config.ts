import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// T25 — single-tunnel ngrok setup.
// The whole app is reached through the Vite dev server: it serves the React app AND
// proxies /api (REST) and /ws (WebSocket) to the Spring backend on :8080. That means a
// single ngrok tunnel pointed at this server (5173) is enough for both HTTP and WebSocket,
// and everything is same-origin (no CORS, no second public URL to share).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on 0.0.0.0 so ngrok / other devices on the LAN can reach it
    allowedHosts: true, // demo only: accept the random *.ngrok-free.app Host header
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true, changeOrigin: true },
    },
  },
})
