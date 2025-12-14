import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = Number(process.env.PORT || 8174);

export default defineConfig({
  plugins: [react()],
  server: {
    port
  }
})
