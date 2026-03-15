import type { Ref } from 'vue'
import type { ChatFile } from './message-types'

export interface PromptInputMessage {
  text: string
  files: ChatFile[]
}

export interface AttachmentFile extends ChatFile {
  id: string
  file?: File
}

export type PromptInputFileAttachment = {
  id?: string
  type: 'file'
  file?: File
  filename?: string
  mediaType?: string
  data?: string
  url?: string
}

export type PromptInputImageAttachment = {
  id?: string
  type: 'image'
  file?: File
  filename?: string
  mediaType?: string
  data?: string
  url?: string
}

export type PromptInputFileUrlAttachment = {
  id?: string
  type: 'file_url'
  url: string
  filename?: string
  mediaType?: string
}

export type PromptInputAttachment =
  | PromptInputFileAttachment
  | PromptInputImageAttachment
  | PromptInputFileUrlAttachment

export interface AttachmentTriggerSlotProps {
  addAttachments: (attachments: PromptInputAttachment[]) => void
}

export interface AiBotVisibilityOptions {
  ensureVisible?: boolean
}

export interface AiBotInputApi {
  setTextInput: (text: string) => void
  addAttachments: (attachments: PromptInputAttachment[]) => void
  sendMessage: (options?: AiBotVisibilityOptions) => Promise<void>
}

export interface AiBotPublicApi extends AiBotInputApi {}

export interface AskAiBotPublicApi extends AiBotPublicApi {}

export interface PromptInputContext {
  textInput: Ref<string>
  files: Ref<AttachmentFile[]>
  isLoading: Ref<boolean>
  fileInputRef: Ref<HTMLInputElement | null>
  setTextInput: (val: string) => void
  addAttachments: (attachments: PromptInputAttachment[]) => void
  addFiles: (files: File[] | FileList) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  clearInput: () => void
  openFileDialog: () => void
  sendMessage: () => void
}
