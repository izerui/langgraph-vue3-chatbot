// 消息类型
export type MessageType = 'ai' | 'human' | 'system' | 'tool'

// 工具调用
export interface ToolCall {
  id: string
  name: string
  args: string
  result?: string
  state?: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
  error?: string
}

// 聊天消息
export interface ChatMessage {
  key: string
  type: MessageType
  content: string
  toolCalls?: ToolCall[]
  batchId?: string
}
