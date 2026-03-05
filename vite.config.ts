import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        // 代理 LangGraph API 请求到后端
        '/agent': {
          target: env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/agent/, '') // 移除 /agent 前缀
        }
      }
    }
  }
})
