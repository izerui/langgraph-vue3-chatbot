<script setup lang="ts">
import { computed } from 'vue'
import type { ChatStatus } from 'ai'
import { getProviderByModelName, type ModelInfo } from './lib/models'
import PromptInputAttachmentsDisplay from './InputAttachmentsDisplay.vue'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-bot/ai-elements/prompt-input'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-bot/ai-elements/model-selector'
import { CheckIcon, ChevronDownIcon, GlobeIcon, Loader2Icon } from 'lucide-vue-next'
import type { PromptInputMessage } from '@/components/ai-bot/ai-elements/prompt-input'

interface Props {
  status: ChatStatus
  currentModel: ModelInfo | null
  models: ModelInfo[]
  useWebSearch: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [message: PromptInputMessage]
  'update:currentModel': [model: ModelInfo]
  'update:useWebSearch': [value: boolean]
}>()

const modelSelectorOpen = defineModel<boolean>('modelSelectorOpen', { default: false })

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

function toggleWebSearch() {
  emit('update:useWebSearch', !props.useWebSearch)
}
</script>

<template>
  <div class="input-wrapper">
    <PromptInput
      multiple
      global-drop
      class="w-full"
      @submit="emit('submit', $event)"
    >
      <!-- 附件显示区域 -->
      <PromptInputHeader>
        <PromptInputAttachmentsDisplay />
      </PromptInputHeader>

      <!-- 文本输入区域 -->
      <PromptInputBody>
        <PromptInputTextarea />
      </PromptInputBody>

      <!-- 底部工具栏 -->
      <PromptInputFooter>
        <PromptInputTools>
          <!-- 添加附件菜单 -->
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <!-- 语音输入按钮 -->
<!--          <PromptInputSpeechButton />-->

          <!-- 网页搜索开关 -->
<!--          <PromptInputButton-->
<!--            :variant="useWebSearch ? 'default' : 'ghost'"-->
<!--            @click="toggleWebSearch"-->
<!--          >-->
<!--            <GlobeIcon :size="16" />-->
<!--            <span>Search</span>-->
<!--          </PromptInputButton>-->

          <!-- 模型选择器 -->
          <ModelSelector v-model:open="modelSelectorOpen">
            <ModelSelectorTrigger as-child>
              <PromptInputButton class="flex items-center gap-1">
                <img
                  v-if="selectedModelData"
                  :src="`https://models.dev/logos/${getProviderByModelName(selectedModelData.name)}.svg`"
                  class="size-4 rounded-sm object-contain"
                  :alt="selectedModelData.name"
                  @error="(e) => { (e.target as HTMLImageElement).src = 'https://models.dev/logos/openai.svg' }"
                >
                <span v-if="selectedModelData" class="whitespace-nowrap">{{ selectedModelData.name }}</span>
                <span v-else class="text-muted-foreground">选择模型</span>
                <ChevronDownIcon class="size-4 opacity-50 shrink-0" />
              </PromptInputButton>
            </ModelSelectorTrigger>

            <ModelSelectorContent>
              <ModelSelectorInput placeholder="搜索模型..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>未找到模型</ModelSelectorEmpty>

                <template v-for="provider in providers" :key="provider">
                  <ModelSelectorGroup :heading="provider">
                    <ModelSelectorItem
                      v-for="model in groupedModels[provider]"
                      :key="model.name"
                      :value="model.name"
                      @select="() => handleModelSelect(model.name)"
                      class="cursor-pointer gap-1"
                    >
                      <img
                        :src="`https://models.dev/logos/${getProviderByModelName(model.name)}.svg`"
                        class="size-4 rounded-sm object-contain"
                        :alt="model.name"
                        @error="(e) => { (e.target as HTMLImageElement).src = 'https://models.dev/logos/openai.svg' }"
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
                    </ModelSelectorItem>
                  </ModelSelectorGroup>
                </template>
              </ModelSelectorList>
            </ModelSelectorContent>
          </ModelSelector>
        </PromptInputTools>

        <!-- 发送按钮 -->
        <PromptInputSubmit :status="status" />
      </PromptInputFooter>
    </PromptInput>
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
