<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Client } from '@langchain/langgraph-sdk'
import type { ChatStatus } from 'ai'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import type { ChatMessage, ModelInfo, ToolUIInfo, ToolUIState } from '@/components/ai-bot/types/chat'

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
  threadId?: string
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
const isMaximized = ref(false)
const threadId = ref<string | null>(null)
const status = ref<ChatStatus>('ready')
const useWebSearch = ref(false)
const modelId = ref('gpt-4o')
const modelSelectorOpen = ref(false)

// 消息
const messages = ref<ChatMessage[]>([])

// 创建线程
async function createThread() {
  try {
    const thread = await client.threads.create({
      ...(props.threadId ? { threadId: props.threadId, ifExists: 'do_nothing' } : {}),
      metadata: {
        user_id: 'user001',
      }
    })
    threadId.value = thread.thread_id || props.threadId || ''
  } catch (error) {
    console.error('Failed to create thread:', error)
  }
}

// 获取对话历史
async function loadThreadHistory() {
  if (!threadId.value) return

  try {
    const state = await client.threads.getState(threadId.value)
    const values = state.values as any

    if (!values?.messages || !Array.isArray(values.messages)) {
      return
    }

    const loadedMessages: ChatMessage[] = []
    const langgraphMessages = values.messages

    let i = 0
    while (i < langgraphMessages.length) {
      const msg = langgraphMessages[i]
      const msgType = msg.type
      const msgContent = msg.content as any

      // system 消息 暂时屏蔽system 消息的显示
      if (msgType === 'system' && 1 + 1 === 3) {
        const content = typeof msgContent === 'string' ? msgContent : Array.isArray(msgContent)
          ? msgContent.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
          : ''
        if (content) {
          loadedMessages.push({
            key: msg.id || `system-${Date.now()}-${Math.random()}`,
            type: 'system',
            content
          })
        }
        i++
        continue
      }

      // 处理 human/user 消息
      if (msgType === 'human' || msgType === 'user') {
        const content = typeof msgContent === 'string' ? msgContent : Array.isArray(msgContent)
          ? msgContent.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
          : ''
        loadedMessages.push({
          key: msg.id || `human-${Date.now()}-${Math.random()}`,
          type: 'human',
          content
        })
        i++
        continue
      }

      // 处理 ai 消息
      if (msgType === 'ai') {
        const content = typeof msgContent === 'string' ? msgContent : Array.isArray(msgContent)
          ? msgContent.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
          : ''

        // 获取 tool_calls
        const toolCalls = msg.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.name,
          args: JSON.stringify(tc.args, null, 2),
          state: 'output-available' as ToolUIState,
          result: ''
        })) || []

        // 先添加 AI 消息
        loadedMessages.push({
          key: msg.id || `ai-${Date.now()}-${Math.random()}`,
          type: 'ai',
          content,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined
        })

        // 检查是否有工具调用，从紧跟着的 tool 消息中获取结果
        if (toolCalls.length > 0) {
          let j = i + 1
          while (j < langgraphMessages.length) {
            const nextMsg = langgraphMessages[j]
            if (nextMsg.type === 'tool') {
              const toolMsgContent = typeof nextMsg.content === 'string' ? nextMsg.content : JSON.stringify(nextMsg.content)
              const toolCallId = nextMsg.tool_call_id

              // 找到对应的 tool_call 并填充结果
              const toolCall = toolCalls.find(tc => tc.id === toolCallId)
              if (toolCall) {
                toolCall.result = toolMsgContent
                toolCall.state = 'output-available'

                // 创建独立的工具消息
                const toolMessageId = `tool-${toolCallId}-${Date.now()}`
                loadedMessages.push({
                  key: toolMessageId,
                  type: 'tool',
                  content: toolMsgContent,
                  toolCalls: [{
                    id: toolCallId,
                    name: toolCall.name,
                    args: toolCall.args,
                    result: toolMsgContent,
                    state: 'output-available'
                  }]
                })
              }
              j++
            } else {
              break
            }
          }
        }
        i++
        continue
      }

      i++
    }

    messages.value = loadedMessages
  } catch (error) {
    console.error('Failed to load thread history:', error)
  }
}

// 初始化
onMounted(async () => {
  if (props.threadId) {
    await createThread()
    await loadThreadHistory()
  }
})

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
  '演示几个工具调用,针对每个工具演示要进行说明.',
  '今天天气怎么样？'
]

// 切换展开状态
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    isMaximized.value = false
  }
}

// 切换最大化状态
function toggleMaximize() {
  isMaximized.value = !isMaximized.value
}

// 发送消息
async function handleSubmit(userMessage: string) {
  if (status.value === 'streaming') return

  status.value = 'streaming'

  // 添加用户消息
  const userMessageId = `human-${Date.now()}`
  messages.value = [
    ...messages.value,
    {
      key: userMessageId,
      type: 'human',
      content: userMessage
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
            model: 'qwen3.5-plus',
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
    const assistantMessageId = `ai-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: assistantMessageId,
        type: 'ai',
        content: '',
        batchId: ''
      }
    ]

    let assistantContent = ''
    const assistantToolCalls: { id: string; name: string; args: string }[] = []
    let runId = ''
    let needNewAssistantMessage = false // 是否需要创建新的 assistant 消息

    // 流式处理 LangGraph SDK 返回的消息
    for await (const chunk of streamResponse) {
      const chunkEvent = chunk.event as string
      const data = chunk.data as any

      // 从 metadata 事件中获取 run_id
      if (chunkEvent === 'metadata' && data?.run_id) {
        runId = data.run_id
      }

      if (chunkEvent === 'messages' || chunkEvent === 'messages/partial') {
        const messageArray = Array.isArray(data) ? data : [data]
        const message = messageArray[0] as any

        // 从消息元数据中获取 run_id
        const messageMeta = messageArray[1] as any
        if (messageMeta?.run_id) {
          runId = messageMeta.run_id
        }

        if (message) {
          // 获取消息类型
          const messageType = message.type

          // 处理工具消息 - tool 类型
          if (messageType === 'tool') {
            const toolCallId = message.tool_call_id
            const toolName = message.name || '未知工具'
            const toolResult = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
            const toolStatus = message.status

            // 获取工具参数
            const toolArgs = assistantToolCalls.find(tc => tc.id === toolCallId)?.args || ''

            // 映射后端状态到 UI 状态
            const mapToolStatus = (status: string): ToolUIState => {
              switch (status) {
                case 'success': return 'output-available'
                case 'error': return 'output-error'
                case 'running': return 'input-available'
                default: return 'output-available'
              }
            }
            const uiState = mapToolStatus(toolStatus)

            // 创建独立的 tool 消息
            const toolMessageId = `tool-${toolCallId}-${Date.now()}`
            const toolMessage: ChatMessage = {
              key: toolMessageId,
              type: 'tool',
              content: toolResult,
              batchId: runId,
              toolCalls: [{
                id: toolCallId,
                name: toolName,
                args: toolArgs,
                result: toolResult,
                state: uiState,
                error: toolStatus === 'error' ? toolResult : undefined
              }]
            }

            // 直接 push tool 消息到数组（按后端返回顺序）
            messages.value.push(toolMessage)

            console.log('🔧 工具结果:', {
              name: toolName,
              id: toolCallId,
              args: toolArgs,
              result: toolResult,
              status: toolStatus,
              messageCount: messages.value.length
            })

            // 标记下一条 AI 消息需要创建新消息
            needNewAssistantMessage = true

            continue // 跳过后续处理
          }

          // 处理工具调用 - 保存参数供 tool 消息使用
          if (message.tool_calls && message.tool_calls.length > 0) {
            for (const tc of message.tool_calls) {
              const existing = assistantToolCalls.find(t => t.id === tc.id)
              if (!existing) {
                assistantToolCalls.push({
                  id: tc.id,
                  name: tc.name,
                  args: JSON.stringify(tc.args, null, 2)
                })
              }
            }
          }

          // 处理 AI 消息 - AIMessageChunk 类型，流式累加 content
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

          // 检查是否需要创建新消息（tool 消息后第一条 AI 消息）
          if (needNewAssistantMessage) {
            // 标记当前 ai 消息完成
            for (let i = messages.value.length - 1; i >= 0; i--) {
              if (messages.value[i].type === 'ai') {
                break
              }
            }

            // 创建新的 ai 消息
            const newAssistantMessageId = `ai-${Date.now()}`
            messages.value.push({
              key: newAssistantMessageId,
              type: 'ai',
              content: '',
              batchId: runId
            })
            assistantContent = ''
            needNewAssistantMessage = false
          }

          // 更新消息内容 - 后端返回的是增量内容，需要累加
          // content 可能是空字符串，所以用 !== undefined 来判断
          if (content !== undefined) {
            // 直接累加内容
            assistantContent += content
          }

          // 找到最后一条 ai 消息并更新
          let lastAssistantIndex = -1
          for (let i = messages.value.length - 1; i >= 0; i--) {
            if (messages.value[i].type === 'ai') {
              lastAssistantIndex = i
              break
            }
          }
          if (lastAssistantIndex >= 0) {
            messages.value[lastAssistantIndex].content = assistantContent
            messages.value[lastAssistantIndex].batchId = runId
          }
        }
      }
    }

    const lastIndex = messages.value.length - 1
    if (lastIndex >= 0) {
      messages.value[lastIndex].batchId = runId
    }

    status.value = 'ready'
  } catch (error) {
    console.error('Error sending message:', error)

    const errorMessageId = `error-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: errorMessageId,
        type: 'ai',
        content: '抱歉，发生了一些错误，请稍后重试。',
        batchId: errorMessageId
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
</script>

<template>
  <div class="ask-ai-bot">
    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-show="isExpanded" class="chat-window" :class="{ maximized: isMaximized }">
        <ChatHeader
          :title="assistantName"
          :is-maximized="isMaximized"
          @close="toggleExpanded"
          @toggle-maximize="toggleMaximize"
        />

        <ChatMessages
          :messages="messages"
          @copy="handleCopy"
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
  position: fixed;
  top: 20px;
  right: 20px;
  width: max(300px, min(500px, calc(100vw - 40px)));
  height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
  background: var(--background);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  overflow: hidden;
}

.chat-window.maximized {
  top: 20px;
  right: 20px;
  left: 20px;
  width: auto;
  height: calc(100vh - 40px);
  border-radius: 12px;
  border: 1px solid var(--border);
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
