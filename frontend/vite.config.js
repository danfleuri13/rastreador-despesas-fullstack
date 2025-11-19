import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // <--- ISSO É OBRIGATÓRIO
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true // Ajuda o Docker no Windows a ver mudanças
    }
  }
})