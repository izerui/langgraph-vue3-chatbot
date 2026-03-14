import { inject } from 'vue'
import type { PromptInputContext } from './input-types'

export type {
  PromptInputMessage,
  AttachmentFile,
  PromptInputFileAttachment,
  PromptInputImageAttachment,
  PromptInputFileUrlAttachment,
  PromptInputAttachment,
  AttachmentTriggerSlotProps,
  PromptInputContext,
} from './input-types'

export const PROMPT_INPUT_KEY = Symbol('PromptInputContext')

export function usePromptInput() {
  const context = inject<PromptInputContext>(PROMPT_INPUT_KEY)
  if (!context) {
    throw new Error('usePromptInput must be used within a PromptInput component')
  }
  return context
}
