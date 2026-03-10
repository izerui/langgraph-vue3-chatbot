<script setup lang="ts">
import { computed, ref, provide, onBeforeUnmount } from 'vue'
import type { ChatStatus } from 'ai'
import type { FileUIPart } from 'ai'
import { nanoid } from 'nanoid'
import { PROMPT_INPUT_KEY, type AttachmentFile, type PromptInputContext } from './lib/prompt-input'
import { getProviderByModelName, type ModelInfo } from './lib/models'
import PromptInputAttachmentsDisplay from './InputAttachmentsDisplay.vue'
import { CheckIcon, ChevronDownIcon, Loader2Icon, CornerDownLeftIcon, SquareIcon, XIcon, PlusIcon, ImageIcon } from 'lucide-vue-next'
import { InputGroup, InputGroupAddon, InputGroupTextarea, InputGroupButton } from '@/components/ai-bot/ui/input-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ai-bot/ui/dropdown-menu'

// ============== 类型定义 ==============
interface Props {
  status: ChatStatus
  currentModel: ModelInfo | null
  models: ModelInfo[]
  useWebSearch: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [message: { text: string, files: FileUIPart[] }]
  stop: []
  'update:currentModel': [model: ModelInfo]
  'update:useWebSearch': [value: boolean]
}>()

const modelSelectorOpen = defineModel<boolean>('modelSelectorOpen', { default: false })

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

const addFiles = (incoming: File[] | FileList) => {
  const fileList = Array.from(incoming)
  const newAttachments: AttachmentFile[] = fileList.map(file => ({
    id: nanoid(),
    type: 'file',
    url: URL.createObjectURL(file),
    mediaType: file.type,
    filename: file.name,
    file,
  }))
  files.value = [...files.value, ...newAttachments]
  hasFiles.value = files.value.length > 0
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
        return { ...item, url: dataUrl ?? item.url }
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
  if (props.status === 'streaming' || props.status === 'submitted') {
    return 'destructive'
  }
  return 'submit'
})

const submitIcon = computed(() => {
  if (props.status === 'submitted') {
    return Loader2Icon
  }
  else if (props.status === 'streaming') {
    return SquareIcon
  }
  else if (props.status === 'error') {
    return XIcon
  }
  return CornerDownLeftIcon
})

const iconClass = computed(() => {
  if (props.status === 'submitted') {
    return 'size-4 animate-spin'
  }
  return 'size-4'
})

const isDisabled = computed(() => {
  return isEmpty.value
})

const isLoadingStatus = computed(() => {
  return props.status === 'streaming' || props.status === 'submitted'
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
      <InputGroup class="overflow-hidden" style="background-color: white;">
        <!-- 附件显示区域 (PromptInputHeader) -->
        <InputGroupAddon
          align="block-end"
          class="order-first flex-wrap gap-1"
        >
          <PromptInputAttachmentsDisplay />
        </InputGroupAddon>

        <!-- 文本输入区域 (PromptInputBody) -->
        <div class="contents">
          <InputGroupTextarea
            v-model="inputText"
            placeholder="有什么我能帮您的?"
            name="message"
            class="field-sizing-content max-h-48 min-h-16"
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
            <!-- 添加附件菜单 -->
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <InputGroupButton type="button" class="cursor-pointer">
                  <PlusIcon class="size-4" />
                </InputGroupButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem @select.prevent="openFileDialog">
                  <ImageIcon class="mr-2 size-4" />
                  添加照片或文件
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <!-- 语音输入按钮 -->
            <!-- <PromptInputSpeechButton /> -->

            <!-- 网页搜索开关 -->
            <!-- <PromptInputButton
              :variant="useWebSearch ? 'default' : 'ghost'"
              @click="toggleWebSearch"
            >
              <GlobeIcon :size="16" />
              <span>Search</span>
            </PromptInputButton> -->

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
                  <div class="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {{ provider }}
                  </div>
                  <DropdownMenuItem
                    v-for="model in groupedModels[provider]"
                    :key="model.name"
                    @select="() => handleModelSelect(model.name)"
                    class="cursor-pointer gap-1"
                  >
                    <img
                      :src="`https://models.dev/logos/${getProviderByModelName(model.name)}.svg`"
                      class="size-4 rounded-sm object-contain"
                      :alt="model.name"
                      @error="handleImageError"
                    >
                    <span class="flex-1 truncate">
                      {{ model.name }}
                      <span v-if="model.is_default" class="ml-1.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
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
          </div>

          <!-- 发送按钮 (PromptInputSubmit) -->
          <InputGroupButton
            aria-label="Submit"
            type="button"
            size="icon-sm"
            :variant="buttonVariant"
            :disabled="isDisabled"
            @click="handleSubmitClick"
          >
            <component :is="submitIcon" :class="iconClass" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  </div>
</template>

<style scoped>
.input-wrapper {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--background);
  flex-shrink: 0;
}
</style>
