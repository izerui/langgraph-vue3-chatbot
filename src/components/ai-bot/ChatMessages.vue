<script setup lang="ts">
import type { ChatMessage } from './lib/types'
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
  isStreaming?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false
})

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

<style scoped>
.custom-message {
  padding: 8px 0;
}

.custom-type-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
  background: #e0e7ff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.custom-content {
  margin: 0;
  padding: 8px;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>

<template>
  <Conversation>
    <ConversationContent>
      <template v-for="(message, index) in messages" :key="message.key">
        <!-- system/custom 消息按照 assistant 方式渲染 -->
        <Message
          :from="message.type === 'tool' || message.type === 'system' || message.type === 'custom' ? 'assistant' : message.type === 'human' ? 'user' : 'assistant'"
          :class="getMessageClass(index)"
        >
          <!-- tool 消息：显示 ToolCall -->
          <template v-if="message.type === 'tool'">
            <ToolCall :tool-calls="message.toolCalls" />
          </template>

          <!-- custom 消息：显示自定义内容 -->
          <template v-else-if="message.type === 'custom'">
            <MessageContent>
              <div class="custom-message">
                <div class="custom-type-badge">{{ message.customContent?.type }}</div>
                <pre class="custom-content">{{ JSON.stringify(message.customContent?.content, null, 2) }}</pre>
              </div>
            </MessageContent>
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
      <!-- 加载指示器 - 放在左边跟 AI 消息一样 -->
      <Message v-if="isStreaming" from="assistant">
        <div class="loading-indicator">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </Message>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>
