import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // Accesible desde red local e internet
    // Mismo puerto que producción (Apache en 5175). En la misma máquina: no pueden
    // correr a la vez Vite dev y Apache en 5175 — detén uno o despliega con `build`.
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3099",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5175,
  },
})
