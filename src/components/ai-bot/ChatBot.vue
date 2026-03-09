<script setup lang="ts">
import './chatbot.css'
import { ref, onMounted } from 'vue'
import type { ChatStatus } from 'ai'
import type { PromptInputMessage } from './lib/prompt-input'
import type { ChatMessage } from './types/chat'
import { fetchModels, getDefaultModel, type ModelInfo } from './lib/models'
import { Client } from '@langchain/langgraph-sdk'
import { createThread, loadThreadHistory } from './lib/thread'

import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'
import ChatSuggestions from './ChatSuggestions.vue'
import ChatInput from './ChatInput.vue'
import { Loader } from './ai-elements/loader'

interface Props {
  assistantId?: string
  assistantName?: string
  defaultExpanded?: boolean
  systemPrompt?: string
  threadId?: string
  userId?: string
  showHeaderActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Chat',
  defaultExpanded: false,
  systemPrompt: '用中文回答',
  userId: 'user001',
  showHeaderActions: true
})

// LangGraph Client
const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024'
const apiKey = import.meta.env.VITE_LANGGRAPH_API_KEY
const client = new Client({
  apiUrl,
  apiKey: apiKey || undefined
})

// 状态
const isMaximized = ref(false)
const threadId = ref<string | null>(null)
const status = ref<ChatStatus>('ready')
const runId = ref<string>('')
const useWebSearch = ref(false)
const modelSelectorOpen = ref(false)
const isLoading = ref(true)

// 消息
const messages = ref<ChatMessage[]>([])

// 模型列表
const models = ref<ModelInfo[]>([])
const currentModel = ref<ModelInfo | null>(null)

// 初始化
onMounted(async () => {
  isLoading.value = true
  // 并行获取模型列表和加载历史
  await Promise.all([
    (async () => {
      const data = await fetchModels(apiUrl)
      models.value = data
      currentModel.value = getDefaultModel(data) || null
    })(),
    props.threadId ? (async () => {
      const tid = await createThread(client, props.threadId, props.userId)
      threadId.value = tid
      const history = await loadThreadHistory(client, tid)
      messages.value = history
    })() : Promise.resolve()
  ])
  isLoading.value = false
})

// 建议列表
const suggestions = [
  '你好，请介绍一下自己',
  '你能做什么？',
  '演示几个工具调用,针对每个工具演示要进行说明.',
  '今天天气怎么样？'
]

// 切换最大化状态
function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  emit('update:isMaximized', isMaximized.value)
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
          user_id: props.userId,
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
            model_provider: currentModel.value?.provider || 'openai',
            model: currentModel.value?.name || '',
            base_url: currentModel.value?.base_url || ''
          }
        },
        metadata: {
          user_id: props.userId,
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
    // 使用 Map 通过 index 跟踪工具调用，因为流式过程中 id 可能为空
    const assistantToolCalls = new Map<number, { id: string; name: string; args: string }>()
    // id 到 index 的映射，用于在 tool 消息中查找对应的参数
    const toolIdToIndex = new Map<string, number>()
    let needNewAssistantMessage = false // 是否需要创建新的 assistant 消息

    // 流式处理 LangGraph SDK 返回的消息
    for await (const chunk of streamResponse) {
      const chunkEvent = chunk.event as string
      const data = chunk.data as any

      // 从 metadata 事件中获取 run_id
      if (chunkEvent === 'metadata' && data?.run_id) {
        runId.value = data.run_id
      }

      if (chunkEvent === 'messages' || chunkEvent === 'messages/partial') {
        const messageArray = Array.isArray(data) ? data : [data]
        const message = messageArray[0] as any

        // 从消息元数据中获取 run_id
        const messageMeta = messageArray[1] as any
        if (messageMeta?.run_id) {
          runId.value = messageMeta.run_id
        }

        if (message) {
          // 获取消息类型
          const messageType = message.type

          // 处理工具消息 - tool 类型（阶段4：结果返回）
          if (messageType === 'tool') {
            const toolCallId = message.tool_call_id
            const toolName = message.name || '未知工具'
            const toolResult = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
            const toolStatus = message.status

            // 从累加的 tool_call_chunks 中获取完整的工具参数
            // 通过 id 查找对应的 index，再获取 args
            const toolIndex = toolIdToIndex.get(toolCallId)
            const toolCallInfo = toolIndex !== undefined ? assistantToolCalls.get(toolIndex) : undefined
            const toolArgs = toolCallInfo?.args || ''

            // 映射后端状态到 UI 状态
            const mapToolStatus = (status: string): string => {
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
              batchId: runId.value,
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

          // 处理 tool_call_chunks - 流式累加工具参数（阶段1-3）
          // 工具参数是通过 tool_call_chunks 逐步流式发送的
          // 使用 index 来匹配同一个工具调用
          if (message.tool_call_chunks && message.tool_call_chunks.length > 0) {
            for (const tcChunk of message.tool_call_chunks) {
              const index = tcChunk.index
              if (index === undefined) continue

              // 记录 id 到 index 的映射
              if (tcChunk.id) {
                toolIdToIndex.set(tcChunk.id, index)
              }

              let existing = assistantToolCalls.get(index)
              if (!existing) {
                // 新工具调用 - 保存 id（可能为空）和 name（name 可能为空，后续会更新）
                assistantToolCalls.set(index, {
                  id: tcChunk.id || '',
                  name: tcChunk.name || '',
                  args: tcChunk.args || ''
                })
              } else {
                // 累加参数 - 直接追加字符串
                if (tcChunk.args) {
                  existing.args = (existing.args || '') + tcChunk.args
                }
                // 更新 id（如果新 chunk 有 id）
                if (tcChunk.id && !existing.id) {
                  existing.id = tcChunk.id
                }
                // 更新名称（如果新 chunk 有名称）
                if (tcChunk.name) {
                  existing.name = tcChunk.name
                }
              }
            }

            console.log('📝 工具参数累加:', Array.from(assistantToolCalls.entries()).map(([k, v]) => ({ index: k, ...v })))
          }

          // 处理 tool_calls - 获取完整的工具调用信息（阶段1：首次出现）
          if (message.tool_calls && message.tool_calls.length > 0) {
            for (const tc of message.tool_calls) {
              const index = message.tool_calls?.indexOf(tc) ?? 0
              // 记录 id 到 index 的映射
              toolIdToIndex.set(tc.id, index)

              // 更新或创建工具调用信息
              if (!assistantToolCalls.has(index)) {
                assistantToolCalls.set(index, {
                  id: tc.id,
                  name: tc.name,
                  args: JSON.stringify(tc.args, null, 2)
                })
              } else {
                const existing = assistantToolCalls.get(index)!
                if (tc.id) existing.id = tc.id
                if (tc.name) existing.name = tc.name
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
              batchId: runId.value
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
            messages.value[lastAssistantIndex].batchId = runId.value
          }
        }
      }
    }

    const lastIndex = messages.value.length - 1
    if (lastIndex >= 0) {
      messages.value[lastIndex].batchId = runId.value
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

// 处理停止按钮点击
async function handleStop() {
  if (threadId.value && runId.value) {
    try {
      await client.runs.cancel(threadId.value, runId.value)
      status.value = 'ready'
    }
    catch (error) {
      console.error('Failed to stop stream:', error)
      status.value = 'ready'
    }
  }
  else {
    status.value = 'ready'
  }
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

const emit = defineEmits<{
  close: []
  'update:isMaximized': [value: boolean]
}>()

// 关闭聊天窗口
function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="chat-bot">
    <div class="chat-window" :class="{ maximized: isMaximized }">
      <ChatHeader
        :title="assistantName"
        :is-maximized="isMaximized"
        :show-header-actions="showHeaderActions"
        @close="handleClose"
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
        :current-model="currentModel"
        :models="models"
        :use-web-search="useWebSearch"
        v-model:modelSelectorOpen="modelSelectorOpen"
        @submit="handleFormSubmit"
        @stop="handleStop"
        @update:current-model="currentModel = $event"
        @update:use-web-search="useWebSearch = $event"
      />

      <!-- 加载遮罩 -->
      <div v-if="isLoading" class="loading-mask">
        <Loader :size="24" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-bot {
  width: 100%;
  height: 100%;
}

.chat-window {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--background);
  border-radius: 8px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  position: relative;
}

.chat-window.maximized {
  border-radius: 8px;
  border: 1px solid var(--border);
}

.loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
}
</style>
