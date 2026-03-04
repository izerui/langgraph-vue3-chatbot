<template>
  <div class="ai-chat-container">
    <!-- 对话容器 -->
    <div class="conversation" ref="conversationRef">
      <!-- 消息列表 -->
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <!-- 用户/AI 头像 -->
        <div class="message-avatar">
          {{ message.role === 'user' ? '👤' : '🤖' }}
        </div>
        
        <div class="message-content">
          <!-- 消息角色名 -->
          <div class="message-role">
            {{ message.role === 'user' ? '你' : 'AI 助手' }}
          </div>
          
          <!-- 消息内容 -->
          <div class="message-text">
            <!-- 加载动画 -->
            <div v-if="message.role === 'assistant' && isLoading && index === messages.length - 1" class="shimmer-loading">
              <span class="shimmer-line" style="width: 60%"></span>
              <span class="shimmer-line" style="width: 80%"></span>
              <span class="shimmer-line" style="width: 40%"></span>
            </div>
            <template v-else>
              {{ message.content }}
            </template>
          </div>
          
          <!-- 推理过程 (如果有) -->
          <div v-if="message.reasoning" class="reasoning">
            <div class="reasoning-header" @click="toggleReasoning(index)">
              <span class="reasoning-icon">🧠</span>
              <span>推理过程</span>
              <span class="reasoning-toggle">{{ expandedReasoning === index ? '▼' : '▶' }}</span>
            </div>
            <div v-if="expandedReasoning === index" class="reasoning-content">
              {{ (message as any).reasoning }}
            </div>
          </div>
          
          <!-- 工具调用展示 (使用 any 类型避免 TypeScript 错误) -->
          <div v-if="(message as any).toolCalls && (message as any).toolCalls.length > 0" class="tool-calls">
            <div class="tool-header">
              <span class="tool-icon">🔧</span>
              <span>工具调用</span>
            </div>
            <div v-for="(tool, toolIndex) in (message as any).toolCalls" :key="toolIndex" class="tool-item">
              <div class="tool-name">{{ tool.name }}</div>
              <div class="tool-args">{{ JSON.stringify(tool.arguments, null, 2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 建议提示 -->
    <div v-if="suggestions.length > 0 && !isLoading" class="suggestions">
      <div class="suggestions-header">💡 你可以问：</div>
      <div class="suggestions-list">
        <button
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="suggestion-btn"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <input
        v-model="inputMessage"
        type="text"
        placeholder="输入消息... (Shift+Enter 换行)"
        :disabled="isLoading"
        @keydown.enter="handleSubmit"
      />
      <button 
        @click="handleSubmit" 
        :disabled="isLoading || !inputMessage.trim()"
        class="send-btn"
      >
        <span v-if="!isLoading">发送</span>
        <span v-else class="loading-spinner"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useChat } from '@ai-sdk/vue'

interface Props {
  api?: string
  suggestions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  api: '/api/chat',
  suggestions: () => [
    '你好，请介绍一下自己',
    '你能做什么？',
    '给我讲个笑话'
  ]
})

// 对话引用
const conversationRef = ref<HTMLElement | null>(null)

// 展开的推理过程索引
const expandedReasoning = ref<number | null>(null)

// 使用 @ai-sdk/vue 的 useChat hook
const { messages, input, isLoading, append } = useChat({
  api: props.api
})

// 本地输入框
const inputMessage = ref('')

// 建议列表
const suggestions = ref<string[]>(props.suggestions)

// 同步本地输入到 useChat
watch(inputMessage, (val) => {
  input.value = val
})

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (conversationRef.value) {
      conversationRef.value.scrollTop = conversationRef.value.scrollHeight
    }
  })
}

// 监听消息变化自动滚动
watch(messages, () => {
  scrollToBottom()
  
  // AI 回复后更新建议
  if (messages.value.length > 0) {
    const lastMessage = messages.value[messages.value.length - 1]
    if (lastMessage.role === 'assistant') {
      updateSuggestions(lastMessage.content)
    }
  }
}, { deep: true })

// 根据AI回复更新建议
const updateSuggestions = (content: string) => {
  // 根据内容动态生成建议
  const newSuggestions: string[] = []
  
  if (content.includes('你好') || content.includes('hello')) {
    newSuggestions.push('你能做什么？')
    newSuggestions.push('今天天气怎么样？')
  } else if (content.includes('天气')) {
    newSuggestions.push('明天天气怎么样？')
    newSuggestions.push('给我讲个笑话')
  } else {
    newSuggestions.push('谢谢')
    newSuggestions.push('还有其他功能吗？')
    newSuggestions.push('再见')
  }
  
  if (newSuggestions.length > 0) {
    suggestions.value = newSuggestions
  }
}

// 切换推理过程显示
const toggleReasoning = (index: number) => {
  expandedReasoning.value = expandedReasoning.value === index ? null : index
}

// 选择建议
const selectSuggestion = (suggestion: string) => {
  inputMessage.value = suggestion
  handleSubmit()
}

// 处理表单提交
async function handleSubmit() {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''
  input.value = ''
  
  // 发送消息
  await append({
    role: 'user',
    content: userMessage
  })
}

// 组件挂载时滚动到底部
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 对话区域 */
.conversation {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #fafafa;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

/* 头像 */
.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

/* 消息内容 */
.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-role {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.message-text {
  background: #fff;
  padding: 14px 18px;
  border-radius: 18px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.message.user .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-text {
  border-bottom-left-radius: 4px;
  border: 1px solid #eee;
}

/* 推理过程 */
.reasoning {
  margin-top: 8px;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f7ff;
  border: 1px solid #d0e8ff;
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  color: #2563eb;
  font-weight: 500;
  transition: background 0.2s;
}

.reasoning-header:hover {
  background: #e0f0ff;
}

.reasoning-icon {
  font-size: 16px;
}

.reasoning-toggle {
  margin-left: auto;
  font-size: 10px;
}

.reasoning-content {
  padding: 12px 14px;
  font-size: 13px;
  color: #555;
  line-height: 1.6;
  border-top: 1px solid #d0e8ff;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #fff;
}

/* 工具调用 */
.tool-calls {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  background: #fffbf0;
  border: 1px solid #ffe0b2;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #f57c00;
  font-weight: 500;
  background: #fff8e1;
}

.tool-icon {
  font-size: 16px;
}

.tool-item {
  padding: 12px 14px;
  border-top: 1px solid #ffe0b2;
}

.tool-name {
  font-size: 13px;
  font-weight: 600;
  color: #e65100;
  margin-bottom: 6px;
}

.tool-args {
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  background: #fff;
  padding: 8px;
  border-radius: 6px;
  color: #666;
  overflow-x: auto;
}

/* 加载动画 - Shimmer */
.shimmer-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shimmer-line {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 建议区域 */
.suggestions {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.suggestions-header {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 输入区域 */
.input-container {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #eee;
}

.input-container input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #eee;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.input-container input:focus {
  border-color: #667eea;
}

.input-container input:disabled {
  background: #f9f9f9;
  cursor: not-allowed;
}

.send-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 加载 spinner */
.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 滚动条 */
.conversation::-webkit-scrollbar {
  width: 6px;
}

.conversation::-webkit-scrollbar-track {
  background: transparent;
}

.conversation::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.conversation::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>