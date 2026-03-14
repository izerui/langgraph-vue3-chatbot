// ai-bot 模块入口：聚合组件和对外类型。

import './chatbot.css'
import AskAiBot from './AskAiBot.vue'
import ChatBot from './ChatBot.vue'

import type {
  AttachmentFile,
  AttachmentTriggerSlotProps,
  PromptInputAttachment,
  PromptInputContext,
  PromptInputFileAttachment,
  PromptInputFileUrlAttachment,
  PromptInputImageAttachment,
  PromptInputMessage,
} from './lib/input-types'
import type {
  ChatFile,
  ChatFileType,
  ChatMessage,
  ChatStatus,
  CustomContent,
  MessageType,
  ToolCall,
} from './lib/message-types'

export { AskAiBot, ChatBot }
export type {
  AttachmentFile,
  AttachmentTriggerSlotProps,
  ChatFile,
  ChatFileType,
  ChatMessage,
  ChatStatus,
  CustomContent,
  MessageType,
  PromptInputAttachment,
  PromptInputContext,
  PromptInputFileAttachment,
  PromptInputFileUrlAttachment,
  PromptInputImageAttachment,
  PromptInputMessage,
  ToolCall,
}
