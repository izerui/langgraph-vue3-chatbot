// vite.config.ts
import { defineConfig, loadEnv } from "file:///Users/liuyuhua/WebstormProjects/langgraph-vue3-chatbot/node_modules/.pnpm/vite@5.4.21_@types+node@25.3.3_lightningcss@1.31.1/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/liuyuhua/WebstormProjects/langgraph-vue3-chatbot/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@5.4.21_@types+node@25.3.3_lightningcss@1.31.1__vue@3.5.29_typescript@5.9.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import tailwindcss from "file:///Users/liuyuhua/WebstormProjects/langgraph-vue3-chatbot/node_modules/.pnpm/@tailwindcss+vite@4.2.1_vite@5.4.21_@types+node@25.3.3_lightningcss@1.31.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/liuyuhua/WebstormProjects/langgraph-vue3-chatbot";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      proxy: {
        // 代理 LangGraph API 请求到后端
        "/agent": {
          target: env.VITE_LANGGRAPH_API_URL || "http://localhost:2024",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/agent/, "")
          // 移除 /agent 前缀
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbGl1eXVodWEvV2Vic3Rvcm1Qcm9qZWN0cy9sYW5nZ3JhcGgtdnVlMy1jaGF0Ym90XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbGl1eXVodWEvV2Vic3Rvcm1Qcm9qZWN0cy9sYW5nZ3JhcGgtdnVlMy1jaGF0Ym90L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9saXV5dWh1YS9XZWJzdG9ybVByb2plY3RzL2xhbmdncmFwaC12dWUzLWNoYXRib3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKVxuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3Z1ZSgpLCB0YWlsd2luZGNzcygpXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKVxuICAgICAgfVxuICAgIH0sXG4gICAgc2VydmVyOiB7XG4gICAgICBwcm94eToge1xuICAgICAgICAvLyBcdTRFRTNcdTc0MDYgTGFuZ0dyYXBoIEFQSSBcdThCRjdcdTZDNDJcdTUyMzBcdTU0MEVcdTdBRUZcbiAgICAgICAgJy9hZ2VudCc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGVudi5WSVRFX0xBTkdHUkFQSF9BUElfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjIwMjQnLFxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hZ2VudC8sICcnKSAvLyBcdTc5RkJcdTk2NjQgL2FnZW50IFx1NTI0RFx1N0YwMFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1VixTQUFTLGNBQWMsZUFBZTtBQUM3WCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxlQUFlO0FBSHhCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxTQUFTLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztBQUFBLElBQzlCLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDakM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixPQUFPO0FBQUE7QUFBQSxRQUVMLFVBQVU7QUFBQSxVQUNSLFFBQVEsSUFBSSwwQkFBMEI7QUFBQSxVQUN0QyxjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsWUFBWSxFQUFFO0FBQUE7QUFBQSxRQUNoRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
