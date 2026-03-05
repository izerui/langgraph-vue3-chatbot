<script setup lang="ts">
import { ref, computed } from 'vue'
import { Client } from '@langchain/langgraph-sdk'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import type { ChatStatus } from 'ai'
import PromptInputAttachmentsDisplay from './PromptInputAttachmentsDisplay.vue'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import type { AttachmentData } from '@/components/ai-elements/attachments'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from '@/components/ai-elements/message'
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
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { CheckIcon, CopyIcon, GlobeIcon, RefreshCcwIcon, ThumbsDownIcon, ThumbsUpIcon } from 'lucide-vue-next'

interface Props {
  assistantId?: string
  assistantName?: string
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Chat',
  defaultExpanded: false
})

// LangGraph Client
const client = new Client({
  apiUrl: window.location.origin + '/agent'
})

// 状态
const isExpanded = ref(props.defaultExpanded)
const threadId = ref<string | null>(null)
const status = ref<ChatStatus>('ready')
const useWebSearch = ref(false)
const modelId = ref('gpt-4o')
const modelSelectorOpen = ref(false)

// 消息列表
interface MessageVersion {
  id: string
  content: string
}

interface MessageAttachment {
  id: string
  type: 'file'
  url?: string
  mediaType: string
  filename: string
}

interface MessageSource {
  href: string
  title: string
}

interface MessageReasoning {
  content: string
  duration: number
}

interface ChatMessage {
  key: string
  from: 'user' | 'assistant'
  versions: MessageVersion[]
  attachments?: AttachmentData[]
  sources?: MessageSource[]
  reasoning?: MessageReasoning
}

const messages = ref<ChatMessage[]>([])
const liked = ref<Record<string, boolean>>({})
const disliked = ref<Record<string, boolean>>({})

// 模型列表
const models = [
  { id: 'gpt-4o', name: 'GPT-4o', chef: 'OpenAI', chefSlug: 'openai', providers: ['openai', 'azure'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', chef: 'OpenAI', chefSlug: 'openai', providers: ['openai', 'azure'] },
  { id: 'claude-sonnet', name: 'Claude 4 Sonnet', chef: 'Anthropic', chefSlug: 'anthropic', providers: ['anthropic', 'azure', 'google'] },
]

const selectedModelData = computed(() => models.find(m => m.id === modelId.value))

// 建议列表
const suggestions = [
  '你好，请介绍一下自己',
  '你能做什么？',
  '给我讲个笑话',
  '今天天气怎么样？'
]

// 切换展开状态
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

// 发送消息
async function handleSubmit(userMessage: string) {
  if (status.value === 'streaming') return

  status.value = 'streaming'

  // 添加用户消息
  const userMessageId = `user-${Date.now()}`
  messages.value = [
    ...messages.value,
    {
      key: userMessageId,
      from: 'user',
      versions: [{
        id: userMessageId,
        content: userMessage
      }]
    }
  ]

  try {
    if (!threadId.value) {
      const thread = await client.threads.create({
        metadata: {
          user_id: 'user001',
          name: userMessage.slice(0, 50)
        }
      })
      threadId.value = thread.thread_id
    }

    const messageId = crypto.randomUUID()
    const streamResponse = client.runs.stream(
      threadId.value!,
      props.assistantId,
      {
        input: {
          messages: [{
            id: messageId,
            type: 'human',
            content: [{ type: 'text', text: userMessage }]
          }]
        },
        config: {
          tags: ['serv'],
          configurable: {
            model_provider: 'openai',
            model: 'MiniMax/MiniMax-M2.5',
            base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          }
        },
        metadata: {
          user_id: 'user001',
          name: userMessage.slice(0, 50)
        },
        streamMode: ['messages-tuple', 'values', 'custom'],
        stream_resumable: false,
        on_disconnect: 'cancel'
      } as any
    )

    // 添加空的助手消息
    const assistantMessageId = `assistant-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: assistantMessageId,
        from: 'assistant',
        versions: [{
          id: assistantMessageId,
          content: ''
        }]
      }
    ]

    let assistantContent = ''

    for await (const chunk of streamResponse) {
      const chunkEvent = chunk.event as string
      let content = ''

      if (chunkEvent === 'messages' || chunkEvent === 'messages/partial') {
        const data = chunk.data as any
        if (data?.chunk?.text) {
          content = data.chunk.text
        } else if (data?.message?.content) {
          const messageContent = data.message.content
          content = typeof messageContent === 'string'
            ? messageContent
            : messageContent[0]?.text || ''
        }
      } else if (chunkEvent === 'values') {
        const data = chunk.data as any
        if (data?.messages) {
          const msgs = data.messages
          if (Array.isArray(msgs) && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1]
            content = typeof lastMsg.content === 'string'
              ? lastMsg.content
              : lastMsg.content?.[0]?.text || ''
          }
        }
      }

      if (content) {
        assistantContent += content

        // 更新最后一条消息的版本内容
        const lastIndex = messages.value.length - 1
        if (messages.value[lastIndex]?.from === 'assistant') {
          messages.value[lastIndex].versions[0].content = assistantContent
        }
      }
    }

    status.value = 'ready'
  } catch (error) {
    console.error('Error sending message:', error)

    const errorMessageId = `error-${Date.now()}`
    messages.value = [
      ...messages.value,
      {
        key: errorMessageId,
        from: 'assistant',
        versions: [{
          id: errorMessageId,
          content: '抱歉，发生了一些错误，请稍后重试。'
        }]
      }
    ]
    status.value = 'ready'
  }
}

// 处理表单提交
function handleFormSubmit(message: PromptInputMessage) {
  const hasText = !!message.text
  const hasAttachments = message.files?.length > 0

  if (!hasText && !hasAttachments) {
    return
  }

  status.value = 'submitted'

  const text = message.text?.trim() || ''
  handleSubmit(text || 'Sent with attachments')
}

// 选择建议
function handleSuggestionClick(suggestion: string) {
  status.value = 'submitted'
  handleSubmit(suggestion)
}

// 选择模型
function handleModelSelect(id: string) {
  modelId.value = id
  modelSelectorOpen.value = false
}

// 切换搜索
function toggleWebSearch() {
  useWebSearch.value = !useWebSearch.value
}

// 消息操作
function handleCopy(content: string) {
  navigator.clipboard.writeText(content)
}

function handleRetry() {
  console.log('Retrying...')
}

function toggleLike(key: string) {
  liked.value = {
    ...liked.value,
    [key]: !liked.value[key],
  }
}

function toggleDislike(key: string) {
  disliked.value = {
    ...disliked.value,
    [key]: !disliked.value[key],
  }
}
</script>

<template>
  <div class="ask-ai-bot">
    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-if="isExpanded" class="chat-window">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="chat-title">
            <span class="title-text">{{ assistantName }}</span>
          </div>
          <button class="close-btn" @click="toggleExpanded" type="button">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 对话区域 -->
        <Conversation>
          <ConversationContent>
            <Message
              v-for="message in messages"
              :key="message.key"
              :from="message.from"
            >
              <!-- 多版本消息显示 -->
              <MessageBranch
                v-if="message.versions.length > 1"
                :default-branch="0"
              >
                <MessageBranchContent>
                  <MessageContent
                    v-for="version in message.versions"
                    :key="version.id"
                  >
                    <MessageResponse :content="version.content" />
                  </MessageContent>
                </MessageBranchContent>

                <MessageToolbar v-if="message.from === 'assistant'">
                  <MessageBranchSelector :from="message.from">
                    <MessageBranchPrevious />
                    <MessageBranchPage />
                    <MessageBranchNext />
                  </MessageBranchSelector>

                  <MessageActions>
                    <MessageAction
                      label="Retry"
                      tooltip="重新生成"
                      @click="handleRetry"
                    >
                      <RefreshCcwIcon class="size-4" />
                    </MessageAction>

                    <MessageAction
                      label="Like"
                      tooltip="喜欢"
                      @click="toggleLike(message.key)"
                    >
                      <ThumbsUpIcon
                        class="size-4"
                        :fill="liked[message.key] ? 'currentColor' : 'none'"
                      />
                    </MessageAction>

                    <MessageAction
                      label="Dislike"
                      tooltip="不喜欢"
                      @click="toggleDislike(message.key)"
                    >
                      <ThumbsDownIcon
                        class="size-4"
                        :fill="disliked[message.key] ? 'currentColor' : 'none'"
                      />
                    </MessageAction>

                    <MessageAction
                      label="Copy"
                      tooltip="复制"
                      @click="handleCopy(message.versions?.[0]?.content || '')"
                    >
                      <CopyIcon class="size-4" />
                    </MessageAction>
                  </MessageActions>
                </MessageToolbar>
              </MessageBranch>

              <!-- 单版本消息显示 -->
              <div v-else>
                <Attachments
                  v-if="message.attachments && message.attachments.length > 0"
                >
                  <Attachment
                    v-for="attachment in message.attachments"
                    :key="attachment.id"
                    :data="attachment"
                  >
                    <AttachmentPreview />
                    <AttachmentRemove />
                  </Attachment>
                </Attachments>

                <!-- 来源引用 -->
                <Sources v-if="message.sources && message.sources.length > 0">
                  <SourcesTrigger :count="message.sources.length" />
                  <SourcesContent>
                    <Source
                      v-for="source in message.sources"
                      :key="source.href"
                      :href="source.href"
                      :title="source.title"
                    />
                  </SourcesContent>
                </Sources>

                <!-- 推理过程 -->
                <Reasoning
                  v-if="message.reasoning"
                  :duration="message.reasoning.duration"
                >
                  <ReasoningTrigger />
                  <ReasoningContent :content="message.reasoning.content" />
                </Reasoning>

                <MessageContent>
                  <MessageResponse
                    v-if="message.from === 'assistant'"
                    :content="message.versions[0]?.content || ''"
                  />
                  <template v-else>
                    {{ message.versions[0]?.content }}
                  </template>
                </MessageContent>

                <MessageActions v-if="message.from === 'assistant'">
                  <MessageAction
                    label="Retry"
                    tooltip="重新生成"
                    @click="handleRetry"
                  >
                    <RefreshCcwIcon class="size-4" />
                  </MessageAction>

                  <MessageAction
                    label="Like"
                    tooltip="喜欢"
                    @click="toggleLike(message.key)"
                  >
                    <ThumbsUpIcon
                      class="size-4"
                      :fill="liked[message.key] ? 'currentColor' : 'none'"
                    />
                  </MessageAction>

                  <MessageAction
                    label="Dislike"
                    tooltip="不喜欢"
                    @click="toggleDislike(message.key)"
                  >
                    <ThumbsDownIcon
                      class="size-4"
                      :fill="disliked[message.key] ? 'currentColor' : 'none'"
                    />
                  </MessageAction>

                  <MessageAction
                    label="Copy"
                    tooltip="复制"
                    @click="handleCopy(message.content || '')"
                  >
                    <CopyIcon class="size-4" />
                  </MessageAction>
                </MessageActions>
              </div>
            </Message>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <!-- 建议区域 -->
        <div class="suggestions-wrapper">
          <Suggestions>
            <Suggestion
              v-for="suggestion in suggestions"
              :key="suggestion"
              :suggestion="suggestion"
              @click="handleSuggestionClick"
            />
          </Suggestions>
        </div>

        <!-- 输入区域 -->
        <div class="input-wrapper">
          <PromptInput
            multiple
            global-drop
            class="w-full"
            @submit="handleFormSubmit"
          >
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>

            <PromptInputBody>
              <PromptInputTextarea />
            </PromptInputBody>

            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <PromptInputSpeechButton />

                <PromptInputButton
                  :variant="useWebSearch ? 'default' : 'ghost'"
                  @click="toggleWebSearch"
                >
                  <GlobeIcon :size="16" />
                  <span>Search</span>
                </PromptInputButton>

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

              <PromptInputSubmit :status="status" />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </Transition>

    <!-- 悬浮按钮 -->
    <button class="float-button" @click="toggleExpanded" type="button">
      <svg v-if="isExpanded" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ask-ai-bot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: max(300px, min(500px, calc(100vw - 40px)));
  height: 80vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--background);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--primary);
  color: var(--primary-foreground);
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px;
  cursor: pointer;
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.suggestions-wrapper {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--background);
  flex-shrink: 0;
}

.input-wrapper {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--background);
  flex-shrink: 0;
}

.float-button {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--primary);
  border: none;
  cursor: pointer;
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.float-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 40px);
    height: 80vh;
    right: -10px;
  }
}
</style>
