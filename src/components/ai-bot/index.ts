// ai-bot 模块入口：聚合组件和对外类型。

import './chatbot.css'
import AskAiBot from './AskAiBot.vue'
import ChatBot from './ChatBot.vue'
import GeneratedFiles from './GeneratedFiles.vue'

import type {
  AiBotInputApi,
  AiBotPublicApi,
  AiBotVisibilityOptions,
  AskAiBotPublicApi,
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
import type { AiBotTheme } from './lib/theme'

export { AskAiBot, ChatBot, GeneratedFiles }
export type {
  AiBotInputApi,
  AiBotPublicApi,
  AiBotTheme,
  AiBotVisibilityOptions,
  AskAiBotPublicApi,
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
