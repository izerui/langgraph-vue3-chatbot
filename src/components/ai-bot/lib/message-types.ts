// 聊天状态
export type ChatStatus = 'ready' | 'streaming'

// 消息类型
export type MessageType = 'ai' | 'human' | 'system' | 'tool' | 'custom'

// 自定义消息内容
export interface CustomContent {
  type: string
  content: any
}

// 工具调用
export interface ToolCall {
  id: string
  name: string
  args: string
  result?: string
  state?: string
  error?: string
}

export type ChatFileType = 'file' | 'image' | 'file_url'

// 聊天消息附件
export interface ChatFile {
  id?: string
  type?: ChatFileType
  url?: string
  mediaType?: string
  filename?: string
  data?: string
}

// 聊天消息
export interface ChatMessage {
  key: string
  type: MessageType
  content: string
  toolCalls?: ToolCall[]
  batchId?: string
  files?: ChatFile[]
  customContent?: CustomContent
}
