<script setup lang="ts">
import { computed, ref, provide, onBeforeUnmount, watch, nextTick } from 'vue'
import type { ChatStatus } from './lib/message-types'
import { nanoid } from 'nanoid'
import { PROMPT_INPUT_KEY } from './lib/prompt-input'
import type { AiBotInputApi, AttachmentFile, AttachmentTriggerSlotProps, PromptInputAttachment, PromptInputContext } from './lib/input-types'
import { getProviderByModelName, type ModelInfo } from './lib/models'
import PromptInputAttachmentsDisplay from './InputAttachmentsDisplay.vue'
import ChatSuggestions from './ChatSuggestions.vue'
import { CheckIcon, ChevronDownIcon, Loader2Icon, CornerDownLeftIcon, PaperclipIcon, Trash2Icon } from 'lucide-vue-next'
import { InputGroup, InputGroupAddon, InputGroupTextarea, InputGroupButton } from '@/components/ai-bot/ui/input-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ai-bot/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ai-bot/ui/tooltip'
import { usePortalHost } from './lib/portal-host'

// ============== 类型定义 ==============
interface Props {
  status: ChatStatus
  currentModel: ModelInfo | null
  models: ModelInfo[]
  suggestions: string[]
  useWebSearch: boolean
  canResetThread?: boolean
  isResettingThread?: boolean
  allowModelSwitch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canResetThread: false,
  isResettingThread: false,
  allowModelSwitch: true,
})

const emit = defineEmits<{
  submit: [message: { text: string, files: AttachmentFile[] }]
  stop: []
  resetThread: []
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
const isConfirmingReset = ref(false)
const resetConfirmRef = ref<HTMLElement | null>(null)
const resetTriggerRef = ref<HTMLElement | null>(null)
const resetPopoverStyle = ref<Record<string, string>>({})
const { portalHost } = usePortalHost()

// Cleanup object URLs
onBeforeUnmount(() => {
  files.value.forEach((f) => {
    if (f.url && f.url.startsWith('blob:')) {
      URL.revokeObjectURL(f.url)
    }
  })
})

function updateResetPopoverPosition() {
  const triggerEl = resetTriggerRef.value
  const hostEl = portalHost.value
  if (!triggerEl || !hostEl) {
    return
  }

  const triggerRect = triggerEl.getBoundingClientRect()
  const hostRect = hostEl.getBoundingClientRect()
  const popoverWidth = 280
  const spacing = 10

  const left = Math.min(
    Math.max(triggerRect.left - hostRect.left - 4, 8),
    Math.max(hostRect.width - popoverWidth - 8, 8),
  )

  const top = Math.max(triggerRect.top - hostRect.top - spacing, 8)

  resetPopoverStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    '--reset-confirm-arrow-left': `${Math.min(Math.max(triggerRect.left - hostRect.left + (triggerRect.width / 2) - left - 7, 16), popoverWidth - 28)}px`,
  }
}

watch(isConfirmingReset, async (open, _prev, onCleanup) => {
  if (!open) {
    return
  }

  await nextTick()
  updateResetPopoverPosition()

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node | null
    if (resetConfirmRef.value?.contains(target) || resetTriggerRef.value?.contains(target)) {
      return
    }
    isConfirmingReset.value = false
    document.removeEventListener('mousedown', handleClickOutside)
  }

  const handleReposition = () => {
    updateResetPopoverPosition()
  }

  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('resize', handleReposition)
  window.addEventListener('scroll', handleReposition, true)
  onCleanup(() => {
    document.removeEventListener('mousedown', handleClickOutside)
    window.removeEventListener('resize', handleReposition)
    window.removeEventListener('scroll', handleReposition, true)
  })
})

const setTextInput = (val: string) => {
  inputText.value = val
}

function normalizeBase64Data(data: string): string {
  return data.startsWith('data:')
    ? (data.split(',')[1] || '')
    : data
}

function revokeBlobUrl(file: { url?: string }) {
  if (file.url?.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }
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
      : 'file' in attachment
        ? {
            ...attachment,
            id: attachment.id || nanoid(),
            url: URL.createObjectURL(attachment.file),
            mediaType: attachment.mediaType || attachment.file.type || '',
            filename: attachment.filename || attachment.file.name,
          }
        : {
            ...attachment,
            id: attachment.id || nanoid(),
            mediaType: attachment.mediaType,
            filename: attachment.filename,
            data: normalizeBase64Data(attachment.data),
          }

    const normalizedName = normalized.filename?.trim()
    if (normalizedName && existingFilenames.has(normalizedName)) {
      if ('url' in normalized) {
        revokeBlobUrl(normalized)
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
  const attachments: PromptInputAttachment[] = fileList.map((file) => {
    if (file.type.startsWith('image/')) {
      return {
        type: 'image',
        file,
      }
    }

    return {
      type: 'file',
      file,
    }
  })

  addAttachments(attachments)
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

const resetThread: AiBotInputApi['resetThread'] = () => {
  clearInput()
  clearFiles()
  isConfirmingReset.value = false
}

const openFileDialog = () => {
  isConfirmingReset.value = false
  fileInputRef.value?.click()
}

const handleResetThread = () => {
  if (props.status === 'streaming' || props.isResettingThread || !props.canResetThread) {
    return
  }

  isConfirmingReset.value = true
}

const cancelResetThread = () => {
  isConfirmingReset.value = false
}

const confirmResetThread = () => {
  if (props.status === 'streaming' || props.isResettingThread || !props.canResetThread) {
    return
  }

  isConfirmingReset.value = false
  emit('resetThread')
}

const convertBlobUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = typeof reader.result === 'string'
          ? normalizeBase64Data(reader.result)
          : null
        resolve(result)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  }
  catch {
    return null
  }
}

const sendMessage: AiBotInputApi['sendMessage'] = async () => {
  if (props.status === 'streaming') {
    return
  }

  // Process files (convert blob urls to base64 if needed for AI SDK)
  const processedFiles = await Promise.all(
    files.value.map(async (item) => {
      if (item.url && item.url.startsWith('blob:')) {
        const data = await convertBlobUrlToBase64(item.url)
        return {
          ...item,
          data: data ?? item.data,
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

defineExpose<AiBotInputApi>({
  setTextInput,
  addAttachments,
  resetThread,
  sendMessage,
})

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

          <div v-if="files.length > 0" class="input-attachments">
            <PromptInputAttachmentsDisplay />
          </div>

<!--          <div v-if="files.length > 0" class="attachments-divider" />-->
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
          <TooltipProvider>
            <div class="flex items-center gap-1">
              <div ref="resetTriggerRef" class="relative">
                <Tooltip v-if="!isConfirmingReset">
                  <TooltipTrigger as-child>
                    <InputGroupButton
                      type="button"
                      class="attachment-button cursor-pointer text-muted-foreground"
                      :disabled="props.status === 'streaming' || props.isResettingThread || !props.canResetThread"
                      title="新对话"
                      @click="handleResetThread"
                    >
                      <Trash2Icon class="size-4" />
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>清空当前对话</p>
                  </TooltipContent>
                </Tooltip>

                <InputGroupButton
                  v-else
                  type="button"
                  class="attachment-button cursor-pointer text-muted-foreground"
                  :disabled="props.status === 'streaming' || props.isResettingThread || !props.canResetThread"
                  title="新对话"
                  @click="cancelResetThread"
                >
                  <Trash2Icon class="size-4" />
                </InputGroupButton>

              </div>

              <Tooltip>
                <TooltipTrigger as-child>
                  <InputGroupButton
                    type="button"
                    class="attachment-button cursor-pointer text-muted-foreground"
                    title="添加附件"
                    @click="openFileDialog"
                  >
                    <PaperclipIcon class="size-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>添加附件</p>
                </TooltipContent>
              </Tooltip>

            <slot
              name="attachment-trigger"
              :addAttachments="addAttachments"
            />
            </div>
          </TooltipProvider>

          <!-- 右侧：模型选择器 + 发送按钮 -->
          <div class="flex items-center gap-1">
            <!-- 模型选择器 -->
            <DropdownMenu v-if="props.allowModelSwitch" v-model:open="modelSelectorOpen">
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

  <Teleport v-if="isConfirmingReset && portalHost" :to="portalHost">
    <div
      ref="resetConfirmRef"
      class="reset-confirm-popover"
      :style="resetPopoverStyle"
    >
      <div class="reset-confirm-arrow" />
      <p class="reset-confirm-title">清空当前会话？</p>
      <p class="reset-confirm-description">
        当前聊天记录会被清空，并开始一个新的空会话。
      </p>
      <div class="reset-confirm-actions">
        <button
          type="button"
          class="reset-confirm-button reset-confirm-button-secondary"
          @click="cancelResetThread"
        >
          取消
        </button>
        <button
          type="button"
          class="reset-confirm-button reset-confirm-button-danger"
          :disabled="props.status === 'streaming' || props.isResettingThread || !props.canResetThread"
          @click="confirmResetThread"
        >
          确认清空
        </button>
      </div>
    </div>
  </Teleport>
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
  padding: 4px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--ai-scrollbar-thumb) transparent;
}

.input-attachments::-webkit-scrollbar {
  width: 6px;
}

.input-attachments::-webkit-scrollbar-thumb {
  background: var(--ai-scrollbar-thumb);
  border-radius: 999px;
}

.input-attachments::-webkit-scrollbar-thumb:hover {
  background: var(--ai-scrollbar-thumb-hover);
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

.reset-confirm-popover {
  position: absolute;
  z-index: 20;
  width: 280px;
  transform: translateY(-100%);
  padding: 14px;
  border: 1px solid var(--ai-layer-border);
  border-radius: 14px;
  background: var(--ai-layer-bg);
  color: var(--ai-layer-text);
  box-shadow: var(--ai-layer-shadow);
}

.reset-confirm-arrow {
  position: absolute;
  left: var(--reset-confirm-arrow-left, 16px);
  bottom: -7px;
  width: 14px;
  height: 14px;
  background: var(--ai-layer-bg);
  border-right: 1px solid var(--ai-layer-border);
  border-bottom: 1px solid var(--ai-layer-border);
  transform: rotate(45deg);
}

.reset-confirm-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--foreground);
}

.reset-confirm-description {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ai-layer-heading);
}

.reset-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.reset-confirm-button {
  min-width: 64px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.18s ease;
}

.reset-confirm-button-secondary {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ai-control-muted);
}

.reset-confirm-button-secondary:hover {
  background: var(--ai-control-hover-bg);
  color: var(--ai-control-hover-text);
}

.reset-confirm-button-danger {
  background: var(--destructive);
  color: white;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--destructive) 22%, transparent);
}

.reset-confirm-button-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--destructive) 28%, transparent);
}

.reset-confirm-button-danger:disabled,
.reset-confirm-button-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}
</style>
