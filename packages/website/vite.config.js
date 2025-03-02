import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    extensions: ['.ts','.tsx','.js','.vue','.json']
  },
  server: {
    host: '0.0.0.0',
    port: 18001,
    allowedHosts: ['nas.tchen.fun']
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    }
  },
  optimizeDeps: {
    exclude: ['vue-demi']
  }
})
