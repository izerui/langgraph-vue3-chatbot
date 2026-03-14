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
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: [
        'vue',
        '@langchain/langgraph-sdk',
        '@vueuse/core',
        'ai',
        'class-variance-authority',
        'clsx',
        'lucide-vue-next',
        'markstream-vue',
        'mermaid',
        'motion-v',
        'nanoid',
        'reka-ui',
        'shiki',
        'tailwind-merge',
        'vue-stick-to-bottom'
      ],
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css') ? 'components/ai-bot/chatbot.css' : 'assets/[name]-[hash][extname]'
      }
    }
  }
})
