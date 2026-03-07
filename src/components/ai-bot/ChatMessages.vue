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
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface Props {
  messages: ChatMessage[]
}

const props = defineProps<Props>()

function getMessageClass(index: number) {
  if (index === 0) return ''
  const current = props.messages[index]
  const previous = props.messages[index - 1]
  if (current.batchId !== undefined && current.batchId === previous.batchId) {
    return '-mt-8'
  }
  return ''
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
                :typewriter="true"
                :initial-render-batch-size="12"
                :render-batch-size="24"
                :render-batch-delay="20"
                :max-live-nodes="220"
                :live-node-buffer="40"
                :defer-nodes-until-visible="true"
                :viewport-priority="true"
              />
              <template v-else>
                {{ message.versions[0]?.content }}
              </template>
            </MessageContent>
          </template>
        </Message>
      </template>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>
