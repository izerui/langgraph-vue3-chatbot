<script setup lang="ts">
import AskAIBot from './components/AskAIBot.vue'
</script>

<template>
  <div class="app-container">
    <header>
      <h1>🤖 AI Chat</h1>
      <p class="subtitle">Vue 3 + @ai-sdk/vue</p>
    </header>

    <main>
      <div class="content">
        <h2>欢迎使用 AI Chat</h2>
        <p>本应用展示如何使用 <strong>@ai-sdk/vue</strong> 构建 AI 聊天应用：</p>

        <ul>
          <li>✅ 使用 <code>@ai-sdk/vue</code> 官方 hooks</li>
          <li>✅ 流式响应支持 - 实时消息更新</li>
          <li>✅ 组件化设计 - 轻松集成到其他工程</li>
          <li>✅ 工具调用支持</li>
        </ul>

        <div class="features">
          <h3>核心功能</h3>
          <div class="feature-grid">
            <div class="feature-card">
              <h4>💬 对话</h4>
              <p>支持多轮对话，上下文自动保持</p>
            </div>
            <div class="feature-card">
              <h4>📡 流式响应</h4>
              <p>实时显示 AI 生成内容</p>
            </div>
            <div class="feature-card">
              <h4>🎨 组件化</h4>
              <p>可复用的 AskAIBot 组件</p>
            </div>
            <div class="feature-card">
              <h4>⚙️ 可配置</h4>
              <p>支持自定义 API 端点</p>
            </div>
          </div>
        </div>

        <div class="setup-guide">
          <h3>⚙️ 后端配置</h3>
          <p>确保后端 API 运行并实现 AI SDK 流式响应格式。</p>
          <p>默认 API 端点: <code>/api/chat</code></p>
        </div>
      </div>
    </main>

    <!-- AI 聊天组件 - 右下角悬浮 -->
    <AskAIBot
      assistant-id="research"
      :default-expanded="false"
    />
  </div>
</template>
