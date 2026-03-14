// npm 包根入口：统一转发 ai-bot 模块的组件与类型，并默认加载聊天组件样式。

import './components/ai-bot/chatbot.css'

export { AskAiBot, ChatBot } from './components/ai-bot'

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
} from './components/ai-bot'
