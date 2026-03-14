import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outDir = resolve(process.cwd(), 'dist-lib')
mkdirSync(outDir, { recursive: true })

const files = {
  'index.d.ts': `export { AskAiBot, ChatBot } from './components/ai-bot/index'
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
} from './components/ai-bot/index'
`
}

for (const [fileName, content] of Object.entries(files)) {
  writeFileSync(resolve(outDir, fileName), content)
}
