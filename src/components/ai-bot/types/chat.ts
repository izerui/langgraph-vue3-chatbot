import type { AttachmentData } from '@/components/ai-elements/attachments'

// 消息版本
export interface MessageVersion {
  id: string
  content: string
  images?: string[]
}

// 消息附件
export interface MessageAttachment {
  id: string
  type: 'file'
  url?: string
  mediaType: string
  filename: string
}

// 消息来源
export interface MessageSource {
  href: string
  title: string
}

// 推理过程
export interface MessageReasoning {
  content: string
  duration: number
}

// 工具调用展示
export interface ToolCallDisplay {
  id: string
  name: string
  args: string
}

// 聊天消息
export interface ChatMessage {
  key: string
  from: 'user' | 'assistant'
  versions: MessageVersion[]
  attachments?: AttachmentData[]
  sources?: MessageSource[]
  reasoning?: MessageReasoning
  toolCalls?: ToolCallDisplay[]
  isComplete?: boolean  // 消息是否渲染完成
}

// 模型信息
export interface ModelInfo {
  id: string
  name: string
  chef: string
  chefSlug: string
  providers: string[]
}
