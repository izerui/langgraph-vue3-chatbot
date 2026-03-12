<script setup lang="ts">
import './chatbot.css'
import { ref, onMounted } from 'vue'
import type { PromptInputMessage } from './lib/prompt-input'
import type { ChatMessage, ChatStatus, ChatFile, CustomContent } from './lib/types'
import { fetchModels, getDefaultModel, type ModelInfo } from './lib/models'
import { KNOWLEDGE_GRAPH_PROMPT } from '@/prompts'
import { Client } from '@langchain/langgraph-sdk'
import { createThread, loadThreadHistory } from './lib/thread'

import ChatHeader from './ChatHeader.vue'
import ChatMessages from './ChatMessages.vue'
import ChatSuggestions from './ChatSuggestions.vue'
import ChatInput from './ChatInput.vue'
import { Loader } from './ai-elements/loader'
import GeneratedFiles from './GeneratedFiles.vue'

interface Props {
  assistantId?: string
  assistantName?: string
  systemPrompt?: string
  threadId?: string
  userId?: string
  showHeaderActions?: boolean
  suggestions?: string[]
  apiUrl?: string
  apiKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Chat',
  systemPrompt: KNOWLEDGE_GRAPH_PROMPT,
  userId: 'user001',
  showHeaderActions: true,
  suggestions: () => [],
  apiUrl: 'http://localhost:2024',
  apiKey: undefined
})

// LangGraph Client
const client = new Client({
  apiUrl: props.apiUrl,
  apiKey: props.apiKey || undefined
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

// 建议问题（支持动态更新）
const suggestions = ref<string[]>([])

// 模型列表
const models = ref<ModelInfo[]>([])
const currentModel = ref<ModelInfo | null>(null)

// 初始化
onMounted(async () => {
  isLoading.value = true
  // 初始化建议问题
  suggestions.value = [...props.suggestions]

  // 并行获取模型列表和加载历史
  await Promise.all([
    (async () => {
      const data = await fetchModels(props.apiUrl)
      models.value = data
      currentModel.value = getDefaultModel(data) || null
    })(),
    props.threadId ? (async () => {
      const tid = await createThread(client, props.threadId, props.userId)
      threadId.value = tid
      messages.value = await loadThreadHistory(client, tid, (questions) => {
        suggestions.value = questions
      })
    })() : Promise.resolve()
  ])
  isLoading.value = false
})

// 切换最大化状态
function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  emit('update:isMaximized', isMaximized.value)
}

// 发送消息
async function handleSubmit(userMessage: string, files: ChatFile[] = []) {
  // 统一状态控制：忙碌状态不允许发送
  if (status.value === 'streaming') return
  status.value = 'streaming'

  // 构建消息内容：文本 + 附件
  const contentBlocks: any[] = []

  // 添加文本内容
  if (userMessage.trim()) {
    contentBlocks.push({ type: 'text', text: userMessage })
  }

  // 添加附件内容
  for (const file of files) {
    if (file.url) {
      // 将 data URL 转换为 base64（移除 data:image/png;base64, 前缀）
      const base64Data = file.url.split(',')[1]
      const mimeType = file.mediaType || 'application/octet-stream'
      if (mimeType.startsWith('image/')) {
        contentBlocks.push({
          type: 'image',
          mimeType: mimeType,
          data: base64Data,
          metadata: { name: file.filename || file.id }
        })
      } else {
        contentBlocks.push({
          type: 'file',
          mimeType: mimeType,
          data: base64Data,
          metadata: { filename: file.filename || file.id }
        })
      }
    }
  }

  // 添加用户消息到本地列表
  const userMessageId = `human-${Date.now()}`
  messages.value = [
    ...messages.value,
    {
      key: userMessageId,
      type: 'human',
      content: userMessage,
      files: files.map(f => ({ url: f.url, mediaType: f.mediaType, filename: f.filename }))
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
              content: contentBlocks
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
    // 使用 Map：通过 message.id + index 来跟踪工具调用
    // message.id 表示消息块，index 表示该消息块中的第几个工具
    // 格式：messageId_index
    // 包含 id, name, args, messageKey（对应 messages 数组中的索引）
    const assistantToolCalls = new Map<string, { id: string; name: string; args: string; messageKey?: string }>()
    let needNewAssistantMessage = false // 是否需要创建新的 assistant 消息

    // 辅助函数：创建工具消息
    function createToolMessage(toolCallId: string, name: string, args: string, state: string): ChatMessage {
      return {
        key: `tool-${toolCallId}-${Date.now()}`,
        type: 'tool',
        content: '',
        batchId: runId.value,
        toolCalls: [{
          id: toolCallId,
          name: name,
          args: args,
          result: '',
          state: state
        }]
      }
    }

    // 辅助函数：更新工具消息
    function updateToolMessage(messageKey: string, updates: { args?: string; result?: string; state?: string }) {
      const msg = messages.value[messageKey]
      if (msg && msg.toolCalls && msg.toolCalls.length > 0) {
        if (updates.args !== undefined) {
          msg.toolCalls[0].args = updates.args
        }
        if (updates.result !== undefined) {
          msg.toolCalls[0].result = updates.result
        }
        if (updates.state !== undefined) {
          msg.toolCalls[0].state = updates.state
        }
      }
    }

    // 流式处理 LangGraph SDK 返回的消息
    for await (const chunk of streamResponse) {
      const chunkEvent = chunk.event as string
      const data = chunk.data as any

      // 从 metadata 事件中获取 run_id
      if (chunkEvent === 'metadata' && data?.run_id) {
        runId.value = data.run_id
      }

      // 处理 custom 事件
      if (chunkEvent === 'custom') {
        handleCustomEvent(data)

        // suggested_questions 类型不外发为消息，只更新 suggestions
        if (data?.type === 'suggested_questions') {
          continue
        }

        // 将其他 custom 消息添加到消息列表
        const customContent: CustomContent = {
          type: data?.type || 'unknown',
          content: data?.content
        }
        const customMessageId = `custom-${Date.now()}`
        messages.value = [
          ...messages.value,
          {
            key: customMessageId,
            type: 'custom',
            content: '',
            customContent
          }
        ]
        console.log('📦 Custom 消息:', customContent)
        continue
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
          // 更新已有的工具消息，而不是创建新的
          if (messageType === 'tool') {
            const toolCallId = message.tool_call_id
            const toolName = message.name || '未知工具'
            const toolResult = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
            const toolStatus = message.status

            // 从累加的 tool_call_chunks 中获取完整的工具参数
            // 查找匹配的 tool call 并更新工具消息
            let foundToolCall: { id: string; name: string; args: string; messageKey?: string } | undefined
            for (const [key, tc] of assistantToolCalls) {
              if (tc.id === toolCallId) {
                foundToolCall = tc
                // 找到后删除，释放内存
                assistantToolCalls.delete(key)
                break
              }
            }

            // 映射后端状态到 UI 状态
            const mapToolStatus = (status: string): string => {
              switch (status) {
                case 'success': return 'completed'
                case 'error': return 'error'
                case 'running': return 'running'
                default: return 'completed'
              }
            }
            const uiState = mapToolStatus(toolStatus)

            // 如果已有对应的工具消息，则更新；否则创建新的
            if (foundToolCall && foundToolCall.messageKey !== undefined) {
              // 更新已有的工具消息
              updateToolMessage(foundToolCall.messageKey, {
                args: foundToolCall.args,
                result: toolResult,
                state: uiState
              })
            } else {
              // 没有找到对应的工具消息，创建新的（兼容情况）
              const toolMessageId = `tool-${toolCallId}-${Date.now()}`
              const toolMessage: ChatMessage = {
                key: toolMessageId,
                type: 'tool',
                content: toolResult,
                batchId: runId.value,
                toolCalls: [{
                  id: toolCallId,
                  name: toolName,
                  args: foundToolCall?.args || '',
                  result: toolResult,
                  state: uiState,
                  error: toolStatus === 'error' ? toolResult : undefined
                }]
              }
              messages.value.push(toolMessage)
            }

            console.log('🔧 阶段4 - 工具结果返回:', {
              name: toolName,
              id: toolCallId,
              args: foundToolCall?.args || '',
              result: toolResult,
              status: toolStatus,
              messageCount: messages.value.length
            })

            // 标记下一条 AI 消息需要创建新消息
            needNewAssistantMessage = true

            continue // 跳过后续处理
          }

          // 阶段3：调用结束 - chunk_position 为 "last" 表示工具调用完成
          // 更新所有工具消息状态为等待结果
          if (message.chunk_position === 'last') {
            for (const [, tc] of assistantToolCalls) {
              if (tc.messageKey !== undefined) {
                updateToolMessage(tc.messageKey, { state: 'running' })
              }
            }
            console.log('🛑 阶段3 - 工具调用结束', {
              chunk_position: message.chunk_position,
              toolCallsCount: assistantToolCalls.size,
              allToolCalls: Array.from(assistantToolCalls.values()).map(t => ({ id: t.id, name: t.name, args: t.args }))
            })
          }

          // 统一处理 tool_calls 和 tool_call_chunks（阶段1-2）
          // 阶段1：tool_calls 到达，补充 id 和 name
          // 阶段2：tool_call_chunks 累加参数
          // 使用 message.id（消息块 id） + index（工具索引）作为 key
          const messageId = message.id
          const hasToolCalls = message.tool_calls && message.tool_calls.length > 0
          const hasChunks = message.tool_call_chunks && message.tool_call_chunks.length > 0

          if (hasToolCalls || hasChunks) {
            // 阶段1：tool_calls 到达，创建工具消息并显示
            if (hasToolCalls) {
              for (const tc of message.tool_calls) {
                const index = message.tool_calls.indexOf(tc)
                const messageKey = `${messageId}_${index}`

                const existing = assistantToolCalls.get(messageKey)
                if (!existing) {
                  // 新建 - 创建工具消息并添加到 messages
                  const toolMsg = createToolMessage(tc.id, tc.name, '', 'start')
                  messages.value.push(toolMsg)
                  // 记录消息在数组中的索引
                  const msgIndex = messages.value.length - 1

                  assistantToolCalls.set(messageKey, {
                    id: tc.id,
                    name: tc.name,
                    args: '',
                    messageKey: msgIndex.toString()
                  })
                  console.log('📝 阶段1 - 工具调用开始:', {
                    messageId,
                    index,
                    toolCallId: tc.id,
                    name: tc.name,
                    msgIndex
                  })
                } else {
                  // 更新 - 只更新 id 和 name
                  if (tc.id) existing.id = tc.id
                  if (tc.name) existing.name = tc.name
                  if (tc.name) existing.name = tc.name
                  // 不覆盖 args，保留 tool_call_chunks 累加的结果
                }
              }
            }

            // 阶段2：tool_call_chunks 累加参数，同时更新工具消息
            if (hasChunks) {
              for (const tcChunk of message.tool_call_chunks) {
                const index = tcChunk.index
                if (index === undefined) continue

                const messageKey = `${messageId}_${index}`

                let existing = assistantToolCalls.get(messageKey)

                if (!existing) {
                  // 如果还没有工具调用记录，用 chunks 创建
                  const toolMsg = createToolMessage(tcChunk.id || '', tcChunk.name || '', tcChunk.args || '', 'running')
                  messages.value.push(toolMsg)
                  const msgIndex = messages.value.length - 1

                  assistantToolCalls.set(messageKey, {
                    id: tcChunk.id || '',
                    name: tcChunk.name || '',
                    args: tcChunk.args || '',
                    messageKey: msgIndex.toString()
                  })
                  console.log('📝 阶段1 - 工具调用开始:', {
                    messageId,
                    index,
                    toolCallId: tcChunk.id || '(暂无)',
                    name: tcChunk.name || '(暂无)',
                    msgIndex
                  })
                } else {
                  // 已有记录 - 累加有实际内容的 args 并更新工具消息
                  if (tcChunk.args && tcChunk.args.trim()) {
                    existing.args = (existing.args || '') + tcChunk.args
                    // 实时更新工具消息的参数和状态
                    if (existing.messageKey) {
                      updateToolMessage(existing.messageKey, { args: existing.args, state: 'running' })
                    }
                  }
                  // 补充 id 和 name
                  if (tcChunk.id && !existing.id) existing.id = tcChunk.id
                  if (tcChunk.name) existing.name = tcChunk.name

                  console.log('📝 阶段2 - args 流式累加:', {
                    messageId,
                    index,
                    newArgs: tcChunk.args,
                    accumulatedArgs: existing.args
                  })
                }
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
  } catch (error: any) {
    console.error('Error sending message:', error)

    // 提取错误信息
    let errorDisplayMessage = '抱歉，发生了一些错误，请稍后重试。'
    if (error) {
      // 尝试从 error 对象中提取详细信息
      const errorMsg = error.message || error.error?.message || String(error)
      const errorType = error.error?.error || error.name || 'APIError'

      // 如果是 API 错误，显示更友好的信息
      if (errorMsg && errorMsg !== '[object Object]') {
        if (errorType === 'APIError' && errorMsg.includes('internal error')) {
          errorDisplayMessage = '服务内部错误，请稍后重试。'
        } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
          errorDisplayMessage = '请求超时，请稍后重试。'
        } else if (errorMsg.includes('network') || errorMsg.includes('Network')) {
          errorDisplayMessage = '网络连接失败，请检查网络后重试。'
        } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          errorDisplayMessage = '认证失败，请重新登录。'
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          errorDisplayMessage = '没有权限执行此操作。'
        } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          errorDisplayMessage = '请求过于频繁，请稍后再试。'
        } else {
          errorDisplayMessage = `抱歉，发生错误: ${errorMsg}`
        }
      }
    }

    const errorMessageId = `error-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: errorMessageId,
        type: 'ai',
        content: errorDisplayMessage,
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

  const text = message.text?.trim() || ''
  handleSubmit(text || 'Sent with attachments', message.files || [])
}

// 处理停止按钮点击
async function handleStop() {
  console.log('🛑 点击停止按钮:', { threadId: threadId.value, runId: runId.value })
  if (threadId.value && runId.value) {
    try {
      console.log('📡 发送 cancel 请求...')
      await client.runs.cancel(threadId.value, runId.value)
      console.log('✅ cancel 请求成功')
      status.value = 'ready'
    }
    catch (error) {
      console.error('❌ cancel 请求失败:', error)
      status.value = 'ready'
    }
  }
  else {
    console.log('⚠️ 缺少 threadId 或 runId，直接重置状态')
    status.value = 'ready'
  }
}

// 选择建议
function handleSuggestionClick(suggestion: string) {
  handleSubmit(suggestion)
}

const emit = defineEmits<{
  close: []
  'update:isMaximized': [value: boolean]
}>()

// 关闭聊天窗口
function handleClose() {
  emit('close')
}

// 处理自定义事件
function handleCustomEvent(data: any) {
  // 处理 suggested_questions 类型
  if (data?.type === 'suggested_questions' && Array.isArray(data?.content)) {
    suggestions.value = data.content
    console.log('📝 更新建议问题:', data.content)
    return
  }

  console.log('Custom event received:', data)
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

      <!-- 空状态：messages 为空时显示 -->
      <div v-if="!isLoading && messages.length === 0" class="flex-1 overflow-y-hidden flex flex-col items-center justify-center">
        <slot name="empty" :send-message="handleSubmit" />
      </div>
      <!-- 有消息时显示 ChatMessages -->
      <ChatMessages
        v-else
        :messages="messages"
        :is-streaming="status === 'streaming'"
      >
        <!-- custom 消息：透传插槽 -->
        <template #custom="{ customContent }">
          <slot name="custom" :customContent="customContent" :threadId="threadId">
            <GeneratedFiles
              v-if="customContent?.type === 'generated_files'"
              :custom-content="customContent"
              :api-url="props.apiUrl"
              :thread-id="threadId"
            />
          </slot>
        </template>
      </ChatMessages>

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
