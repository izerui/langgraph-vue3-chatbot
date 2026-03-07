<script setup lang="ts">
import type { ChatMessage } from './types/chat'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
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
  MessageToolbar,
} from '@/components/ai-elements/message'
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from '@/components/ai-elements/attachments'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { CopyIcon } from 'lucide-vue-next'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface Props {
  messages: ChatMessage[]
}

defineProps<Props>()

const emit = defineEmits<{
  copy: [content: string]
}>()

function handleCopy(message: ChatMessage) {
  emit('copy', message.versions?.[0]?.content || '')
}
</script>

<template>
  <Conversation>
    <ConversationContent>
      <Message
        v-for="message in messages"
        :key="message.key"
        :from="message.from"
      >
        <!-- 多版本消息显示（用于展示 AI 多次生成的结果） -->
        <MessageBranch
          v-if="message.versions.length > 1"
          :default-branch="0"
        >
          <MessageBranchContent>
            <MessageContent
              v-for="version in message.versions"
              :key="version.id"
            >
              <MarkdownRender :content="version.content" />
            </MessageContent>
          </MessageBranchContent>

          <MessageToolbar v-if="message.from === 'assistant' && message.isComplete">
            <MessageBranchSelector :from="message.from">
              <MessageBranchPrevious />
              <MessageBranchPage />
              <MessageBranchNext />
            </MessageBranchSelector>

            <MessageActions>
              <MessageAction
                label="Copy"
                tooltip="复制"
                @click="handleCopy(message)"
              >
                <CopyIcon class="size-4" />
              </MessageAction>
            </MessageActions>
          </MessageToolbar>
        </MessageBranch>

        <!-- 单版本消息显示 -->
        <div v-else>
          <!-- 附件显示 -->
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

          <!-- 消息内容 -->
          <MessageContent>
            <MarkdownRender
              v-if="message.from === 'assistant'"
              :content="message.versions[0]?.content || ''"
            />
            <template v-else>
              {{ message.versions[0]?.content }}
            </template>
          </MessageContent>

          <!-- 消息操作按钮 -->
          <MessageActions v-if="message.from === 'assistant' && message.isComplete">
            <MessageAction
              label="Copy"
              tooltip="复制"
              @click="handleCopy(message)"
            >
              <CopyIcon class="size-4" />
            </MessageAction>
          </MessageActions>
        </div>
      </Message>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>
