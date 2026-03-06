<script setup lang="ts">
import type { ChatStatus } from 'ai'
import type { ModelInfo } from './types/chat'
import PromptInputAttachmentsDisplay from './input-attachments-display.vue'
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
} from '@/components/ai-elements/prompt-input'
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector'
import { CheckIcon, GlobeIcon } from 'lucide-vue-next'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'

interface Props {
  status: ChatStatus
  modelId: string
  models: ModelInfo[]
  useWebSearch: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [message: PromptInputMessage]
  'update:modelId': [id: string]
  'update:useWebSearch': [value: boolean]
}>()

const modelSelectorOpen = defineModel<boolean>('modelSelectorOpen', { default: false })

const selectedModelData = props.models.find(m => m.id === props.modelId)

function handleModelSelect(id: string) {
  emit('update:modelId', id)
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
          <PromptInputSpeechButton />

          <!-- 网页搜索开关 -->
          <PromptInputButton
            :variant="useWebSearch ? 'default' : 'ghost'"
            @click="toggleWebSearch"
          >
            <GlobeIcon :size="16" />
            <span>Search</span>
          </PromptInputButton>

          <!-- 模型选择器 -->
          <ModelSelector v-model:open="modelSelectorOpen">
            <ModelSelectorTrigger as-child>
              <PromptInputButton>
                <ModelSelectorLogo
                  v-if="selectedModelData?.chefSlug"
                  :provider="selectedModelData.chefSlug"
                />
                <ModelSelectorName v-if="selectedModelData?.name">
                  {{ selectedModelData.name }}
                </ModelSelectorName>
              </PromptInputButton>
            </ModelSelectorTrigger>

            <ModelSelectorContent>
              <ModelSelectorInput placeholder="Search models..." />
              <ModelSelectorList>
                <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>

                <ModelSelectorGroup
                  v-for="chef in ['OpenAI', 'Anthropic']"
                  :key="chef"
                  :heading="chef"
                >
                  <ModelSelectorItem
                    v-for="m in models.filter(model => model.chef === chef)"
                    :key="m.id"
                    :value="m.id"
                    @select="() => handleModelSelect(m.id)"
                  >
                    <ModelSelectorLogo :provider="m.chefSlug" />
                    <ModelSelectorName>{{ m.name }}</ModelSelectorName>
                    <ModelSelectorLogoGroup>
                      <ModelSelectorLogo
                        v-for="provider in m.providers"
                        :key="provider"
                        :provider="provider"
                      />
                    </ModelSelectorLogoGroup>
                    <CheckIcon
                      v-if="modelId === m.id"
                      class="ml-auto size-4"
                    />
                    <div v-else class="ml-auto size-4" />
                  </ModelSelectorItem>
                </ModelSelectorGroup>
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
