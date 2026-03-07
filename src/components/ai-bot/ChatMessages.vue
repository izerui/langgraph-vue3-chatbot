<script setup lang="ts">
import type { ChatMessage } from './types/chat'
import ToolCall from './ToolCall.vue'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '@/components/ai-elements/message'
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources'
import { CopyIcon } from 'lucide-vue-next'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface Props {
  messages: ChatMessage[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  copy: [content: string]
}>()

function handleCopy(message: ChatMessage) {
  emit('copy', message.versions?.[0]?.content || '')
}

function getMessageClass(index: number) {
  if (index === 0) return ''
  const current = props.messages[index]
  const previous = props.messages[index - 1]
  if (current.batchId !== undefined && current.batchId === previous.batchId) {
    return '-mt-8'
  }
  return ''
}

// 判断是否是最后一条消息
function isLastMessage(index: number) {
  return index === props.messages.length - 1
}
</script>

<template>
  <Conversation>
    <ConversationContent>
      <template v-for="(message, index) in messages" :key="message.key">
        <Message :from="message.from === 'tool' ? 'assistant' : message.from" :class="getMessageClass(index)">
          <!-- tool 消息：显示 ToolCall -->
          <template v-if="message.from === 'tool'">
            <ToolCall :tool-ui="message.toolUI" />
          </template>

          <!-- assistant/user 消息 -->
          <template v-else>
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

            <Reasoning
              v-if="message.reasoning"
              :duration="message.reasoning.duration"
            >
              <ReasoningTrigger />
              <ReasoningContent :content="message.reasoning.content" />
            </Reasoning>

            <MessageContent>
              <MarkdownRender
                v-if="message.from === 'assistant'"
                :content="message.versions[0]?.content || ''"
              />
              <template v-else>
                {{ message.versions[0]?.content }}
              </template>
            </MessageContent>
          </template>
        </Message>

        <!-- 只有最后一条 assistant 消息完成时才显示操作按钮 -->
        <MessageActions
          v-if="isLastMessage(index) && message.from === 'assistant' && message.isCompleted"
          class="mt-2"
        >
          <MessageAction
            label="Copy"
            tooltip="复制"
            @click="handleCopy(message)"
          >
            <CopyIcon class="size-4" />
          </MessageAction>
        </MessageActions>
      </template>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>
