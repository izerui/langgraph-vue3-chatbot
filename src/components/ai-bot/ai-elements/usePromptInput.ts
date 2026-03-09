import type { FileUIPart } from 'ai'
import type { Ref } from 'vue'

export interface PromptInputMessage {
  text: string
  files: FileUIPart[]
}

export interface AttachmentFile extends FileUIPart {
  id: string
  file?: File
}

export interface PromptInputContext {
  textInput: Ref<string>
  files: Ref<AttachmentFile[]>
  isLoading: Ref<boolean>
  fileInputRef: Ref<HTMLInputElement | null>
  setTextInput: (val: string) => void
  addFiles: (files: File[] | FileList) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  clearInput: () => void
  openFileDialog: () => void
  submitForm: () => void
}

import { inject } from 'vue'

export const PROMPT_INPUT_KEY = Symbol('PromptInputContext')

export function usePromptInput() {
  const context = inject<PromptInputContext>(PROMPT_INPUT_KEY)
  if (!context) {
    throw new Error('usePromptInput must be used within a PromptInput component')
  }
  return context
}
