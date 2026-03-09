<script setup lang="ts">
import type { ChatMessage } from './types/chat'
import ToolCall from './ToolCall.vue'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-bot/ai-elements/conversation'
import {
  Message,
  MessageContent,
} from '@/components/ai-bot/ai-elements/message'
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface Props {
  messages: ChatMessage[]
}

const props = defineProps<Props>()

function getMessageClass(index: number) {
  if (index === 0) return ''
  const current = props.messages[index]
  // 只有 human 消息需要间隔
  if (current.type === 'human') {
    return 'mt-4'
  }
  return ''
}
</script>

<template>
  <Conversation>
    <ConversationContent>
      <template v-for="(message, index) in messages" :key="message.key">
        <!-- system 消息按照 assistant 方式渲染 -->
        <Message
          :from="message.type === 'tool' || message.type === 'system' ? 'assistant' : message.type === 'human' ? 'user' : 'assistant'"
          :class="getMessageClass(index)"
        >
          <!-- tool 消息：显示 ToolCall -->
          <template v-if="message.type === 'tool'">
            <ToolCall :tool-calls="message.toolCalls" />
          </template>

          <!-- assistant/system/human 消息 -->
          <template v-else>
            <MessageContent>
              <!-- assistant 和 system 消息使用 MarkdownRender -->
              <MarkdownRender
                v-if="message.type === 'ai' || message.type === 'system'"
                :content="message.content || ''"
                :typewriter="true"
                :initial-render-batch-size="12"
                :render-batch-size="24"
                :render-batch-delay="20"
                :max-live-nodes="0"
                :defer-nodes-until-visible="true"
                :viewport-priority="true"
              />
              <!-- human 消息使用普通文本 -->
              <template v-else>
                {{ message.content }}
              </template>
            </MessageContent>
          </template>
        </Message>
      </template>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>
