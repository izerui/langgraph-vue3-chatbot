<script setup lang="ts">
import { ref, computed } from 'vue'
import { Client } from '@langchain/langgraph-sdk'
import type { ChatStatus } from 'ai'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import type { ChatMessage, ModelInfo } from '@/components/ai-bot/types/chat'

import ChatHeader from '@/components/ai-bot/ChatHeader.vue'
import ChatMessages from '@/components/ai-bot/ChatMessages.vue'
import ChatSuggestions from '@/components/ai-bot/ChatSuggestions.vue'
import ChatInput from '@/components/ai-bot/ChatInput.vue'
import FloatButton from '@/components/ai-bot/FloatButton.vue'

interface Props {
  assistantId?: string
  assistantName?: string
  defaultExpanded?: boolean
  systemPrompt?: string
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Chat',
  defaultExpanded: false,
  systemPrompt: '用中文回答'
})

// LangGraph Client
const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024'
const apiKey = import.meta.env.VITE_LANGGRAPH_API_KEY
const client = new Client({
  apiUrl,
  apiKey: apiKey || undefined
})

// 状态
const isExpanded = ref(props.defaultExpanded)
const threadId = ref<string | null>(null)
const status = ref<ChatStatus>('ready')
const useWebSearch = ref(false)
const modelId = ref('gpt-4o')
const modelSelectorOpen = ref(false)

// 消息
const messages = ref<ChatMessage[]>([])
const liked = ref<Record<string, boolean>>({})
const disliked = ref<Record<string, boolean>>({})

// 模型列表
const models: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', chef: 'OpenAI', chefSlug: 'openai', providers: ['openai', 'azure'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', chef: 'OpenAI', chefSlug: 'openai', providers: ['openai', 'azure'] },
  { id: 'claude-sonnet', name: 'Claude 4 Sonnet', chef: 'Anthropic', chefSlug: 'anthropic', providers: ['anthropic', 'azure', 'google'] },
]

// 建议列表
const suggestions = [
  '你好，请介绍一下自己',
  '你能做什么？',
  '给我讲个笑话',
  '今天天气怎么样？'
]

// 切换展开状态
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

// 发送消息
async function handleSubmit(userMessage: string) {
  if (status.value === 'streaming') return

  status.value = 'streaming'

  // 添加用户消息
  const userMessageId = `user-${Date.now()}`
  messages.value = [
    ...messages.value,
    {
      key: userMessageId,
      from: 'user',
      versions: [{
        id: userMessageId,
        content: userMessage,
        images: []
      }]
    }
  ]

  try {
    if (!threadId.value) {
      const thread = await client.threads.create({
        metadata: {
          user_id: 'user001',
          name: userMessage.slice(0, 50)
        }
      })
      threadId.value = thread.thread_id
    }

    const streamResponse = client.runs.stream(
      threadId.value!,
      props.assistantId,
      {
        input: {
          messages: [
            ...(props.systemPrompt ? [{
              type: 'system' as const,
              content: [{ type: 'text', text: props.systemPrompt }]
            }] : []),
            {
              type: 'human' as const,
              content: [{ type: 'text', text: userMessage }]
            }
          ]
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
        streamMode: ['messages-tuple', 'custom'],
        stream_resumable: false,
        on_disconnect: 'cancel'
      } as any
    )

    // 添加空的助手消息
    const assistantMessageId = `assistant-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: assistantMessageId,
        from: 'assistant',
        versions: [{
          id: assistantMessageId,
          content: '',
          images: []
        }]
      }
    ]

    let assistantContent = ''
    let assistantImages: string[] = []
    let assistantToolCalls: { id: string; name: string; args: string }[] = []
    let lastContentLength = 0

    // 流式处理 LangGraph SDK 返回的消息
    for await (const chunk of streamResponse) {
      const chunkEvent = chunk.event as string
      const data = chunk.data as any

      if (chunkEvent === 'messages' || chunkEvent === 'messages/partial') {
        const messageArray = Array.isArray(data) ? data : [data]
        const message = messageArray[0] as any

        if (message) {
          // 解析消息内容
          let content = ''
          if (typeof message.content === 'string') {
            content = message.content
          } else if (Array.isArray(message.content)) {
            content = message.content
              .filter((block: any) => block.type === 'text')
              .map((block: any) => block.text)
              .join('')
          }

          // 处理图片内容
          let images: string[] = []
          if (Array.isArray(message.content)) {
            images = message.content
              .filter((block: any) => block.type === 'image_url')
              .map((block: any) =>
                typeof block.image_url === 'string' ? block.image_url : block.image_url?.url
              )
          }

          // 处理工具调用
          let toolCalls: { id: string; name: string; args: string }[] = []
          if (message.tool_calls && message.tool_calls.length > 0) {
            toolCalls = message.tool_calls.map((tc: any) => ({
              id: tc.id,
              name: tc.name,
              args: JSON.stringify(tc.args, null, 2)
            }))
          }

          // 更新消息内容
          if (content) {
            if (content.length > lastContentLength) {
              assistantContent += content.slice(lastContentLength)
              lastContentLength = content.length
            }
            assistantImages = images
            assistantToolCalls = toolCalls

            const lastIndex = messages.value.length - 1
            if (messages.value[lastIndex]?.from === 'assistant') {
              messages.value[lastIndex].versions[0].content = assistantContent
              messages.value[lastIndex].versions[0].images = assistantImages
              messages.value[lastIndex].toolCalls = assistantToolCalls
            }
          }
        }
      }
    }

    status.value = 'ready'
  } catch (error) {
    console.error('Error sending message:', error)

    const errorMessageId = `error-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: errorMessageId,
        from: 'assistant',
        versions: [{
          id: errorMessageId,
          content: '抱歉，发生了一些错误，请稍后重试。',
          images: []
        }]
      }
    ]
    status.value = 'ready'
  }
}

// 处理表单提交
function handleFormSubmit(message: PromptInputMessage) {
  const hasText = !!message.text
  const hasAttachments = message.files?.length > 0

  if (!hasText && !hasAttachments) {
    return
  }

  status.value = 'submitted'

  const text = message.text?.trim() || ''
  handleSubmit(text || 'Sent with attachments')
}

// 选择建议
function handleSuggestionClick(suggestion: string) {
  status.value = 'submitted'
  handleSubmit(suggestion)
}

// 消息操作
function handleCopy(content: string) {
  navigator.clipboard.writeText(content)
}

function handleRetry() {
  console.log('Retrying...')
}

function toggleLike(key: string) {
  liked.value = {
    ...liked.value,
    [key]: !liked.value[key],
  }
}

function toggleDislike(key: string) {
  disliked.value = {
    ...disliked.value,
    [key]: !disliked.value[key],
  }
}
</script>

<template>
  <div class="ask-ai-bot">
    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-show="isExpanded" class="chat-window">
        <ChatHeader
          :title="assistantName"
          @close="toggleExpanded"
        />

        <ChatMessages
          :messages="messages"
          :liked="liked"
          :disliked="disliked"
          @copy="handleCopy"
          @retry="handleRetry"
          @like="toggleLike"
          @dislike="toggleDislike"
        />

        <ChatSuggestions
          :suggestions="suggestions"
          @select="handleSuggestionClick"
        />

        <ChatInput
          :status="status"
          :model-id="modelId"
          :models="models"
          :use-web-search="useWebSearch"
          v-model:modelSelectorOpen="modelSelectorOpen"
          @submit="handleFormSubmit"
          @update:model-id="modelId = $event"
          @update:use-web-search="useWebSearch = $event"
        />
      </div>
    </Transition>

    <FloatButton
      :is-expanded="isExpanded"
      @toggle="toggleExpanded"
    />
  </div>
</template>

<style scoped>
.ask-ai-bot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: max(300px, min(500px, calc(100vw - 40px)));
  height: 80vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--background);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
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
    height: 80vh;
    right: -10px;
  }
}
</style>
