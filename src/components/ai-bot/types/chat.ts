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

// 工具 UI 状态
export type ToolUIState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | 'approval-requested' | 'approval-responded' | 'output-denied'

// 工具 UI 信息
export interface ToolUIInfo {
  id: string
  name: string
  args: string
  result?: string
  state: ToolUIState
  error?: string
}

// 聊天消息
export interface ChatMessage {
  key: string
  from: 'user' | 'assistant' | 'tool'
  versions: MessageVersion[]
  attachments?: AttachmentData[]
  sources?: MessageSource[]
  reasoning?: MessageReasoning
  toolCalls?: ToolUIInfo[]
  isCompleted?: boolean  // 消息是否完成
  batchId?: string      // 批次 ID，同一批次的消息没有间隔
}

// 模型信息
export interface ModelInfo {
  id: string
  name: string
  chef: string
  chefSlug: string
  providers: string[]
}
