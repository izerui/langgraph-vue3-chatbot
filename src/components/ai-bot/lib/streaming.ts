import type { ChatMessage } from '../types/chat'

export interface StreamingCallbacks {
  onMetadata?: (runId: string) => void
  onAIStart?: (content: string) => void
  onAIChunk?: (content: string) => void
  onToolCallStart?: (toolCallId: string, name: string, args: string) => void
  onToolCallArgsUpdate?: (toolCallId: string, args: string) => void
  onToolCallEnd?: (toolCallId: string) => void
  onToolResult?: (toolCallId: string, name: string, args: string, result: string, status: string) => void
  onComplete?: () => void
  onError?: (error: any) => void
}

export interface StreamOptions {
  assistantId: string
  systemPrompt?: string
  modelProvider?: string
  model?: string
  baseUrl?: string
  userId?: string
}

export async function* streamChat(
  client: any,
  threadId: string,
  userMessage: string,
  options: StreamOptions,
  callbacks: StreamingCallbacks
) {
  const assistantToolCalls = new Map<string, { id: string; name: string; args: string }>()

  const streamResponse = client.runs.stream(
    threadId,
    options.assistantId,
    {
      input: {
        messages: [
          ...(options.systemPrompt ? [{
            type: 'system' as const,
            content: [{ type: 'text', text: options.systemPrompt }]
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
          model_provider: options.modelProvider || 'openai',
          model: options.model || '',
          base_url: options.baseUrl || ''
        }
      },
      metadata: {
        user_id: options.userId || 'user001',
        name: userMessage.slice(0, 50)
      },
      streamMode: ['messages-tuple', 'custom'],
      stream_resumable: false,
      on_disconnect: 'cancel'
    } as any
  )

  // 用于累积 AI 内容
  let assistantContent = ''

  for await (const chunk of streamResponse) {
    const chunkEvent = chunk.event as string
    const data = chunk.data as any

    // metadata 事件 - 获取 run_id
    if (chunkEvent === 'metadata' && data?.run_id) {
      callbacks.onMetadata?.(data.run_id)
      yield { type: 'metadata', runId: data.run_id }
      continue
    }

    if (chunkEvent === 'messages' || chunkEvent === 'messages/partial') {
      const messageArray = Array.isArray(data) ? data : [data]
      const message = messageArray[0] as any

      if (!message) continue

      const messageType = message.type

      // 阶段4：tool 消息 - 工具结果返回
      if (messageType === 'tool') {
        const toolCallId = message.tool_call_id
        const toolName = message.name || '未知工具'
        const toolResult = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
        const toolStatus = message.status

        // 从累加的 tool_call_chunks 中获取完整的工具参数
        let toolArgs = ''
        for (const [key, tc] of assistantToolCalls) {
          if (tc.id === toolCallId) {
            toolArgs = tc.args
            assistantToolCalls.delete(key)
            break
          }
        }

        callbacks.onToolResult?.(toolCallId, toolName, toolArgs, toolResult, toolStatus)
        yield {
          type: 'tool-result',
          toolCallId,
          name: toolName,
          args: toolArgs,
          result: toolResult,
          status: toolStatus
        }

        continue
      }

      // 阶段3：chunk_position 为 "last" 表示工具调用完成
      if (message.chunk_position === 'last') {
        callbacks.onToolCallEnd?.('')
        yield { type: 'tool-call-end' }
      }

      // 处理 tool_calls 和 tool_call_chunks（阶段1-2）
      const messageId = message.id
      const hasToolCalls = message.tool_calls && message.tool_calls.length > 0
      const hasChunks = message.tool_call_chunks && message.tool_call_chunks.length > 0

      if (hasToolCalls || hasChunks) {
        // 阶段1：tool_calls 到达
        if (hasToolCalls) {
          for (const tc of message.tool_calls) {
            const index = message.tool_calls.indexOf(tc)
            const messageKey = `${messageId}_${index}`

            const existing = assistantToolCalls.get(messageKey)
            if (!existing) {
              assistantToolCalls.set(messageKey, {
                id: tc.id,
                name: tc.name,
                args: ''
              })
              callbacks.onToolCallStart?.(tc.id, tc.name, '')
              yield {
                type: 'tool-call-start',
                toolCallId: tc.id,
                name: tc.name,
                args: ''
              }
            } else {
              if (tc.id) existing.id = tc.id
              if (tc.name) existing.name = tc.name
            }
          }
        }

        // 阶段2：tool_call_chunks 累加参数
        if (hasChunks) {
          for (const tcChunk of message.tool_call_chunks) {
            const index = tcChunk.index
            if (index === undefined) continue

            const messageKey = `${messageId}_${index}`

            let existing = assistantToolCalls.get(messageKey)

            if (!existing) {
              assistantToolCalls.set(messageKey, {
                id: tcChunk.id || '',
                name: tcChunk.name || '',
                args: tcChunk.args || ''
              })
              callbacks.onToolCallStart?.(tcChunk.id || '', tcChunk.name || '', tcChunk.args || '')
              yield {
                type: 'tool-call-start',
                toolCallId: tcChunk.id || '',
                name: tcChunk.name || '',
                args: tcChunk.args || ''
              }
            } else {
              // 累加有实际内容的 args
              const chunkArgs = typeof tcChunk.args === 'string' ? tcChunk.args : JSON.stringify(tcChunk.args)
              if (chunkArgs && chunkArgs.trim()) {
                existing.args = (existing.args || '') + chunkArgs
                callbacks.onToolCallArgsUpdate?.(existing.id, existing.args)
                yield {
                  type: 'tool-call-args-update',
                  toolCallId: existing.id,
                  args: existing.args
                }
              }
              if (tcChunk.id && !existing.id) existing.id = tcChunk.id
              if (tcChunk.name) existing.name = tcChunk.name
            }
          }
        }
      }

      // 处理 AI 消息内容
      let content = ''
      if (typeof message.content === 'string') {
        content = message.content
      } else if (Array.isArray(message.content)) {
        content = message.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('')
      }

      if (content) {
        assistantContent += content
        callbacks.onAIChunk?.(assistantContent)
        yield { type: 'ai-chunk', content: assistantContent }
      }
    }
  }

  callbacks.onComplete?.()
  yield { type: 'complete' }
}
