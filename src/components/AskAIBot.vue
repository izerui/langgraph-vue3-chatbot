<script setup lang="ts">
import { ref } from 'vue'
import { Client } from '@langchain/langgraph-sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message'

// 简化的消息类型
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface Props {
  assistantId?: string
  assistantName?: string
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Research',
  defaultExpanded: false
})

// LangGraph Client
const client = new Client({
  apiUrl: window.location.origin + '/langgraph'
})

// 状态
const isExpanded = ref(props.defaultExpanded)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const isLoading = ref(false)
const threadId = ref<string | null>(null)

// 建议列表
const suggestions = ref<string[]>([
  '你好，请介绍一下自己',
  '你能做什么？',
  '给我讲个笑话'
])

// 切换展开状态
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

// 发送消息
async function handleSubmit() {
  if (!input.value.trim() || isLoading.value) return

  const userMessage = input.value.trim()
  input.value = ''
  isLoading.value = true

  // 添加用户消息
  messages.value = [
    ...messages.value,
    {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date()
    }
  ]

  try {
    // 创建或使用现有线程
    if (!threadId.value) {
      const thread = await client.threads.create({
        metadata: {
          user_id: 'user001',
          name: userMessage.slice(0, 50)
        }
      })
      threadId.value = thread.thread_id
    }

    // 流式发送消息
    const messageId = crypto.randomUUID()
    const streamResponse = client.runs.stream(
      threadId.value!,
      props.assistantId,
      {
        input: {
          messages: [{
            id: messageId,
            type: 'human',
            content: [{ type: 'text', text: userMessage }]
          }]
        },
        config: {
          tags: ['serv'],
          configurable: {
            model_provider: 'openai',
            model: 'MiniMax/MiniMax-M2.5',
            base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          }
        },
        metadata: {
          user_id: 'user001',
          name: userMessage.slice(0, 50)
        },
        streamMode: ['messages-tuple', 'values', 'custom'],
        stream_resumable: false,
        on_disconnect: 'cancel'
      } as any
    )

    let assistantMessageId = `assistant-${Date.now()}`
    let assistantContent = ''

    // 添加空消息用于显示
    messages.value = [
      ...messages.value,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date()
      }
    ]

    for await (const chunk of streamResponse) {
      console.log('chunk:', chunk)
      const chunkEvent = chunk.event as string

      // 处理不同的 stream_mode 返回格式
      let content = ''

      if (chunkEvent === 'messages' || chunkEvent === 'messages/partial') {
        const data = chunk.data as any
        if (data?.chunk?.text) {
          content = data.chunk.text
        } else if (data?.message?.content) {
          const messageContent = data.message.content
          content = typeof messageContent === 'string'
            ? messageContent
            : messageContent[0]?.text || ''
        }
      } else if (chunkEvent === 'values') {
        const data = chunk.data as any
        if (data?.messages) {
          const msgs = data.messages
          if (Array.isArray(msgs) && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1]
            content = typeof lastMsg.content === 'string'
              ? lastMsg.content
              : lastMsg.content?.[0]?.text || ''
          }
        }
      }

      if (content) {
        assistantContent += content

        // 更新最后一条消息
        const lastIndex = messages.value.length - 1
        if (messages.value[lastIndex]?.role === 'assistant') {
          messages.value[lastIndex].content = assistantContent
        }
      }
    }
  } catch (error) {
    console.error('Error sending message:', error)

    // 添加错误消息
    messages.value = [
      ...messages.value,
      {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，发生了一些错误，请稍后重试。',
        createdAt: new Date()
      }
    ]
  } finally {
    isLoading.value = false
  }
}

// 选择建议
function selectSuggestion(suggestion: string) {
  input.value = suggestion
  handleSubmit()
}

// 键盘提交
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="ask-ai-bot">
    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-if="isExpanded" class="chat-window">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="chat-title">
            <span class="title-icon">🤖</span>
            <span class="title-text">{{ assistantName }}</span>
          </div>
          <button class="close-btn" @click="toggleExpanded" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 对话区域使用 ai-elements 组件 -->
        <Conversation class="messages-container">
          <ConversationContent>
            <ConversationEmptyState v-if="messages.length === 0">
              <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>有什么可以帮助你的吗？</p>
              </div>
            </ConversationEmptyState>

            <template v-for="msg in messages" :key="msg.id">
              <Message :from="msg.role">
                <MessageAvatar src="">
                  {{ msg.role === 'user' ? '👤' : '🤖' }}
                </MessageAvatar>
                <MessageContent>
                  {{ msg.content }}
                </MessageContent>
              </Message>
            </template>

            <div v-if="isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user'" class="loading-indicator">
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
            </div>
          </ConversationContent>
        </Conversation>

        <!-- 建议区域 -->
        <div v-if="suggestions.length > 0 && !isLoading && messages.length > 0" class="suggestions-container">
          <div class="suggestions-list">
            <Button
              v-for="(suggestion, index) in suggestions"
              :key="index"
              variant="outline"
              size="sm"
              @click="selectSuggestion(suggestion)"
            >
              {{ suggestion }}
            </Button>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-container">
          <Input
            v-model="input"
            placeholder="输入您的问题..."
            :disabled="isLoading"
            @keydown="handleKeydown"
          />
          <Button
            :disabled="!input.trim() || isLoading"
            @click="handleSubmit"
          >
            {{ isLoading ? '发送中...' : '发送' }}
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 悬浮按钮 -->
    <button class="float-button" @click="toggleExpanded" type="button">
      <svg v-if="isExpanded" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ask-ai-bot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon { font-size: 20px; }
.title-text { font-size: 16px; font-weight: 600; }

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: #fff;
}

.messages-container {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }

.loading-indicator {
  display: flex;
  gap: 4px;
  padding: 12px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dot:nth-child(1) { animation-delay: 0s; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.suggestions-container {
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.input-container {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #e5e7eb;
}

.input-container :deep(input) {
  flex: 1;
}

.float-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.float-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 120px);
    right: -10px;
  }
}
</style>
