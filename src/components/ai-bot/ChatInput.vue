<script setup lang="ts">
import { computed, ref, provide, onBeforeUnmount } from 'vue'
import type { ChatFileType, ChatStatus } from './lib/message-types'
import { nanoid } from 'nanoid'
import { PROMPT_INPUT_KEY } from './lib/prompt-input'
import type { AttachmentFile, AttachmentTriggerSlotProps, PromptInputAttachment, PromptInputContext } from './lib/input-types'
import { getProviderByModelName, type ModelInfo } from './lib/models'
import PromptInputAttachmentsDisplay from './InputAttachmentsDisplay.vue'
import ChatSuggestions from './ChatSuggestions.vue'
import { CheckIcon, ChevronDownIcon, Loader2Icon, CornerDownLeftIcon, PaperclipIcon } from 'lucide-vue-next'
import { InputGroup, InputGroupAddon, InputGroupTextarea, InputGroupButton } from '@/components/ai-bot/ui/input-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ai-bot/ui/dropdown-menu'

// ============== 类型定义 ==============
interface Props {
  status: ChatStatus
  currentModel: ModelInfo | null
  models: ModelInfo[]
  suggestions: string[]
  useWebSearch: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [message: { text: string, files: AttachmentFile[] }]
  stop: []
  selectSuggestion: [suggestion: string]
  'update:currentModel': [model: ModelInfo]
  'update:useWebSearch': [value: boolean]
}>()

const modelSelectorOpen = defineModel<boolean>('modelSelectorOpen', { default: false })

defineSlots<{
  'attachment-trigger'?: (props: AttachmentTriggerSlotProps) => any
}>()

// ============== PromptInput Context ==============

// 本地状态
const inputText = ref('')
const hasFiles = ref(false)
const files = ref<AttachmentFile[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)

// Cleanup object URLs
onBeforeUnmount(() => {
  files.value.forEach((f) => {
    if (f.url && f.url.startsWith('blob:')) {
      URL.revokeObjectURL(f.url)
    }
  })
})

const setTextInput = (val: string) => {
  inputText.value = val
}

function resolveAttachmentType(attachment: PromptInputAttachment, file?: File, url?: string): ChatFileType {
  if (attachment.type === 'file_url') {
    return 'file_url'
  }
  if (attachment.type === 'image') {
    return 'image'
  }
  if (attachment.type === 'file') {
    return 'file'
  }
  if (url && !url.startsWith('blob:') && !url.startsWith('data:')) {
    return 'file_url'
  }
  const mediaType = file?.type || ''
  return mediaType.startsWith('image/') ? 'image' : 'file'
}

const addAttachments = (incoming: PromptInputAttachment[]) => {
  const existingFilenames = new Set(
    files.value
      .map(file => file.filename?.trim())
      .filter((name): name is string => !!name),
  )

  const newAttachments: AttachmentFile[] = incoming.flatMap((attachment) => {
    const normalized = attachment.type === 'file_url'
      ? {
          ...attachment,
          id: attachment.id || nanoid(),
          type: 'file_url' as const,
          url: attachment.url,
          mediaType: attachment.mediaType || 'application/octet-stream',
          filename: attachment.filename,
        }
      : (() => {
          const file = attachment.file
          const url = attachment.url || (file ? URL.createObjectURL(file) : undefined)
          const type = resolveAttachmentType(attachment, file, url)

          return {
            ...attachment,
            id: attachment.id || nanoid(),
            type,
            url,
            mediaType: attachment.mediaType || file?.type || '',
            filename: attachment.filename || file?.name,
            file,
          }
        })()

    const normalizedName = normalized.filename?.trim()
    if (normalizedName && existingFilenames.has(normalizedName)) {
      if (normalized.url?.startsWith('blob:')) {
        URL.revokeObjectURL(normalized.url)
      }
      return []
    }

    if (normalizedName) {
      existingFilenames.add(normalizedName)
    }

    return [normalized]
  })

  files.value = [...files.value, ...newAttachments]
  hasFiles.value = files.value.length > 0
}

const addFiles = (incoming: File[] | FileList) => {
  const fileList = Array.from(incoming)
  addAttachments(fileList.map(file => ({
    type: file.type.startsWith('image/') ? 'image' : 'file',
    file,
  })))
}

const removeFile = (id: string) => {
  const file = files.value.find(f => f.id === id)
  if (file?.url && file.url.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }
  files.value = files.value.filter(f => f.id !== id)
  hasFiles.value = files.value.length > 0
}

const clearFiles = () => {
  files.value.forEach((f) => {
    if (f.url && f.url.startsWith('blob:')) {
      URL.revokeObjectURL(f.url)
    }
  })
  files.value = []
  hasFiles.value = false
}

const clearInput = () => {
  inputText.value = ''
}

const openFileDialog = () => {
  fileInputRef.value?.click()
}

const convertBlobUrlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  }
  catch {
    return null
  }
}

const sendMessage = async () => {
  // Process files (convert blobs to base64 if needed for AI SDK)
  const processedFiles = await Promise.all(
    files.value.map(async (item) => {
      if (item.url && item.url.startsWith('blob:')) {
        const dataUrl = await convertBlobUrlToDataUrl(item.url)
        return {
          ...item,
          type: item.type === 'file_url' ? 'file' : item.type,
          data: dataUrl ?? item.data,
          url: dataUrl ?? item.url,
        }
      }
      return item
    }),
  )

  const message = {
    text: inputText.value,
    files: processedFiles,
  }

  emit('submit', message)
  clearInput()
  clearFiles()
}

// 提供 context 给子组件
const context: PromptInputContext = {
  textInput: inputText,
  files,
  fileInputRef,
  isLoading,
  setTextInput,
  addAttachments,
  addFiles,
  removeFile,
  clearFiles,
  clearInput,
  openFileDialog,
  sendMessage,
}

provide(PROMPT_INPUT_KEY, context)

// ============== 本地输入状态 ==============

// 输入是否为空
const isEmpty = computed(() => {
  return !inputText.value.trim() && !hasFiles.value
})

const selectedModelData = computed(() => {
  return props.currentModel || props.models.find(m => m.is_default) || props.models[0]
})

// 按提供商分组模型
const groupedModels = computed(() => {
  const groups: Record<string, ModelInfo[]> = {}
  props.models.forEach((model) => {
    const provider = model.provider || 'Other'
    if (!groups[provider]) {
      groups[provider] = []
    }
    groups[provider].push(model)
  })
  return groups
})

const providers = computed(() => Object.keys(groupedModels.value))

function handleModelSelect(name: string) {
  const model = props.models.find(m => m.name === name)
  if (model) {
    emit('update:currentModel', model)
  }
  modelSelectorOpen.value = false
}

// ============== PromptInputTextarea 逻辑 ==============
const isComposing = ref(false)

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    // 忙碌状态不允许发送，但 shift+回车允许换行
    if (isLoadingStatus.value) {
      if (!e.shiftKey)
        e.preventDefault()
      return
    }
    // 中文输入或 shift+回车，允许换行
    if (isComposing.value || e.shiftKey)
      return
    e.preventDefault()
    sendMessage()
  }

  // Remove last attachment on backspace if input is empty
  if (e.key === 'Backspace' && inputText.value === '' && files.value.length > 0) {
    const lastFile = files.value[files.value.length - 1]
    if (lastFile) {
      removeFile(lastFile.id)
    }
  }
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items)
    return

  const pastedFiles: File[] = []
  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file)
        pastedFiles.push(file)
    }
  }

  if (pastedFiles.length > 0) {
    e.preventDefault()
    addFiles(pastedFiles)
  }
}

// ============== PromptInputSubmit 逻辑 ==============
const buttonVariant = computed(() => {
  if (props.status === 'streaming') {
    return 'destructive'
  }
  return 'submit'
})

const submitIcon = computed(() => {
  if (props.status === 'streaming') {
    return Loader2Icon
  }
  return CornerDownLeftIcon
})

const iconClass = computed(() => {
  if (props.status === 'streaming') {
    return 'size-4 animate-spin'
  }
  return 'size-4'
})

const isDisabled = computed(() => {
  // 忙碌状态时不应禁用（需要可以点击取消）
  if (isLoadingStatus.value)
    return false
  return isEmpty.value
})

const isLoadingStatus = computed(() => {
  return props.status === 'streaming'
})

function handleSubmitClick() {
  if (isLoadingStatus.value) {
    emit('stop')
  } else {
    sendMessage()
  }
}

// ============== 图片错误处理 ==============
function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = 'https://models.dev/logos/openai.svg'
}

// ============== 处理文件上传 ==============
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    addFiles(input.files)
  }
  input.value = ''
}
</script>

<template>
  <div class="input-wrapper">
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      multiple
      accept="image/*,.pdf,.doc,.docx,.txt"
      @change="onFileChange"
    >

    <div class="w-full">
      <InputGroup class="input-group-shell overflow-hidden">
        <div class="input-top">
          <div v-if="props.suggestions.length > 0" class="input-suggestions">
            <ChatSuggestions
              :suggestions="props.suggestions"
              @select="emit('selectSuggestion', $event)"
            />
          </div>

          <div v-if="props.suggestions.length > 0" class="attachments-divider" />

          <div class="input-attachments">
            <PromptInputAttachmentsDisplay />
          </div>

          <div v-if="files.length > 0" class="attachments-divider" />
        </div>

        <!-- 文本输入区域 (PromptInputBody) -->
        <div class="contents">
          <InputGroupTextarea
            v-model="inputText"
            placeholder="有什么我能帮您的?"
            name="message"
            class="field-sizing-content max-h-48 min-h-16 pt-2 pb-3"
            @keydown="handleKeyDown"
            @paste="handlePaste"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
          />
        </div>

        <!-- 底部工具栏 (PromptInputFooter) -->
        <InputGroupAddon
          align="block-end"
          class="justify-between gap-1"
        >
          <!-- 工具栏内容 (PromptInputTools) -->
          <div class="flex items-center gap-1">
            <InputGroupButton
              type="button"
              class="attachment-button cursor-pointer text-muted-foreground"
              @click="openFileDialog"
            >
              <PaperclipIcon class="size-4" />
            </InputGroupButton>
            <slot
              name="attachment-trigger"
              :addAttachments="addAttachments"
            />
          </div>

          <!-- 右侧：模型选择器 + 发送按钮 -->
          <div class="flex items-center gap-1">
            <!-- 模型选择器 -->
            <DropdownMenu v-model:open="modelSelectorOpen">
              <DropdownMenuTrigger as-child>
                <InputGroupButton type="button" class="flex items-center gap-1 cursor-pointer">
                  <img
                    v-if="selectedModelData"
                    :src="`https://models.dev/logos/${getProviderByModelName(selectedModelData.name)}.svg`"
                    class="size-4 rounded-sm object-contain"
                    :alt="selectedModelData.name"
                    @error="handleImageError"
                  >
                  <span v-if="selectedModelData" class="whitespace-nowrap">{{ selectedModelData.name }}</span>
                  <span v-else class="text-muted-foreground">选择模型</span>
                  <ChevronDownIcon class="size-4 opacity-50 shrink-0" />
                </InputGroupButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start">
                <template v-for="provider in providers" :key="provider">
                  <div class="px-2 py-1.5 text-xs font-semibold text-[var(--ai-menu-heading)]">
                    请选择模型
                  </div>
                  <DropdownMenuItem
                    v-for="model in groupedModels[provider]"
                    :key="model.name"
                    @select="() => handleModelSelect(model.name)"
                    class="cursor-pointer gap-1 text-[13px] text-[var(--ai-menu-text)]"
                  >
                    <img
                      :src="`https://models.dev/logos/${getProviderByModelName(model.name)}.svg`"
                      class="size-4 rounded-sm object-contain"
                      :alt="model.name"
                      @error="handleImageError"
                    >
                    <span class="flex-1 truncate">
                      {{ model.name }}
                      <span v-if="model.is_default" class="ml-1.5 rounded bg-[var(--ai-muted-surface)] px-1.5 py-0.5 text-[11px] text-[var(--ai-menu-heading)]">
                        默认
                      </span>
                    </span>
                    <CheckIcon
                      v-if="selectedModelData?.name === model.name"
                      class="size-4"
                    />
                  </DropdownMenuItem>
                </template>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- 发送按钮 (PromptInputSubmit) -->
            <InputGroupButton
              aria-label="Submit"
              type="button"
              size="icon-sm"
              :variant="buttonVariant"
              class="cursor-pointer disabled:cursor-not-allowed"
              :disabled="isDisabled"
              @click="handleSubmitClick"
            >
              <component :is="submitIcon" :class="iconClass" />
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </div>
  </div>
</template>

<style scoped>
.input-wrapper {
  padding: 4px 12px 8px;
  border-top: 1px solid var(--ai-border-subtle);
  background: var(--ai-input-panel-bg);
  flex-shrink: 0;
}

.input-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  align-items: flex-start;
}

.input-suggestions {
  width: 100%;
  padding: 8px 12px 0;
}

.input-attachments {
  width: 100%;
  max-height: 120px;
  padding: 0 12px 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--ai-border-subtle) transparent;
}

.input-attachments::-webkit-scrollbar {
  width: 6px;
}

.input-attachments::-webkit-scrollbar-thumb {
  background: var(--ai-border-subtle);
  border-radius: 999px;
}

.input-attachments::-webkit-scrollbar-thumb:hover {
  background: var(--ai-chip-border);
}

.attachments-divider {
  width: calc(100% - 24px);
  margin: 4px 12px 0;
  border-top: 1px solid var(--ai-border-subtle);
}

.input-group-shell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.attachment-button:hover,
.attachment-button:focus,
.attachment-button:focus-visible,
.attachment-button[data-state='open'] {
  background: transparent !important;
  color: inherit !important;
}
</style>
