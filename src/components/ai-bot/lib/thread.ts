import { Client } from '@langchain/langgraph-sdk'
import type { ChatMessage } from '../types/chat'

// 创建线程
export async function createThread(
  client: Client,
  threadId?: string,
  userId?: string
): Promise<string> {
  try {
    const thread = await client.threads.create({
      ...(threadId ? { threadId, ifExists: 'do_nothing' } : {}),
      metadata: {
        user_id: userId || 'user001',
      }
    })
    return thread.thread_id || threadId || ''
  } catch (error) {
    console.error('Failed to create thread:', error)
    return threadId || ''
  }
}

// 获取对话历史
export async function loadThreadHistory(
  client: Client,
  threadId: string
): Promise<ChatMessage[]> {
  if (!threadId) return []

  try {
    const state = await client.threads.getState(threadId)
    const values = state.values as any

    if (!values?.messages || !Array.isArray(values.messages)) {
      return []
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
          state: 'output-available' as const,
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

    return loadedMessages
  } catch (error) {
    console.error('Failed to load thread history:', error)
    return []
  }
}
