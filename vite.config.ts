import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      // 代理 LangGraph API 请求到后端
      '/langgraph': {
        target: 'http://localhost:2024',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/langgraph/, '') // 移除 /langgraph 前缀
      }
    }
  }
})
