<script setup lang="ts">
import AskAIBot from './components/AskAIBot.vue'
import ChatBotExample from './components/ai-elements/examples/chatbot.vue'
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

        <!-- AI 元素组件示例 -->
        <div class="component-demo">
          <h3>🎨 组件示例 - Chatbot UI</h3>
          <div class="demo-container">
            <ChatBotExample />
          </div>
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

<style>

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.app-container {
  min-height: 100vh;
  position: relative;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 20px;
  text-align: center;
}

header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
}

main {
  padding: 20px;
}

.content {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.content h2 {
  margin-bottom: 16px;
  color: #333;
}

.content ul {
  margin: 16px 0;
  padding-left: 24px;
}

.content li {
  margin: 10px 0;
  color: #555;
  line-height: 1.6;
}

.content code {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #e65100;
}

.features {
  margin-top: 32px;
}

.features h3 {
  margin-bottom: 16px;
  color: #333;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.feature-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.feature-card h4 {
  color: #667eea;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 14px;
  color: #666;
}

.setup-guide {
  margin-top: 32px;
  padding: 20px;
  background: #fff8e1;
  border-radius: 8px;
  border: 1px solid #ffe0b2;
}

.setup-guide h3 {
  color: #f57c00;
  margin-bottom: 12px;
}

.setup-guide p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.component-demo {
  margin-top: 32px;
}

.component-demo h3 {
  margin-bottom: 16px;
  color: #333;
}

.demo-container {
  height: 600px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}
</style>