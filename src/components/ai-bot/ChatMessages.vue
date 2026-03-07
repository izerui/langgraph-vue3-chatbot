<script setup lang="ts">
import type { ChatMessage, ToolUIInfo } from './types/chat'
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
import { ToolCalls } from '@/components/ai-elements/tool-calls'
import {
  Sandbox,
  SandboxContent,
  SandboxHeader,
  SandboxTabContent,
  SandboxTabs,
  SandboxTabsBar,
  SandboxTabsList,
  SandboxTabsTrigger,
} from '@/components/ai-elements/sandbox'
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block'
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

// 计算每个消息的 class，根据是否与前一个消息同批次来调整间距
function getMessageClass(index: number) {
  if (index === 0) return ''
  const current = props.messages[index]
  const previous = props.messages[index - 1]
  // 如果两个消息来自同一个 batch（同一批次回复），则合并显示，无间隔
  if (current.batchId !== undefined && current.batchId === previous.batchId) {
    return '-mt-8'
  }
  return ''
}
</script>

<template>
  <Conversation>
    <ConversationContent>
      <!-- tool 消息渲染 -->
      <template v-for="(message, index) in messages" :key="message.key">
        <div v-if="message.from === 'tool'" class="mt-2">
          <Sandbox
            v-for="toolUI in message.toolUI"
            :key="toolUI.id"
          >
            <SandboxHeader :state="toolUI.state" :title="toolUI.name" />
            <SandboxContent>
              <SandboxTabs default-value="code">
                <SandboxTabsBar>
                  <SandboxTabsList>
                    <SandboxTabsTrigger value="code">
                      Code
                    </SandboxTabsTrigger>
                    <SandboxTabsTrigger value="output">
                      Output
                    </SandboxTabsTrigger>
                  </SandboxTabsList>
                </SandboxTabsBar>
                <SandboxTabContent value="code">
                  <CodeBlock
                    class="border-0"
                    :code="toolUI.args"
                    language="python"
                  >
                    <CodeBlockCopyButton class="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </CodeBlock>
                </SandboxTabContent>
                <SandboxTabContent value="output">
                  <CodeBlock
                    v-if="toolUI.state === 'output-error'"
                    class="border-0 text-red-500"
                    :code="toolUI.error || ''"
                    language="javascript"
                  >
                    <CodeBlockCopyButton class="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </CodeBlock>
                  <CodeBlock
                    v-else
                    class="border-0"
                    :code="toolUI.result || ''"
                    language="log"
                  >
                    <CodeBlockCopyButton class="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </CodeBlock>
                </SandboxTabContent>
              </SandboxTabs>
            </SandboxContent>
          </Sandbox>
        </div>

        <!-- assistant/user 消息渲染 -->
        <Message
          v-else
          :from="message.from"
          :class="getMessageClass(index)"
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

          <MessageToolbar v-if="message.from === 'assistant' && message.isCompleted">
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
          <MessageActions v-if="message.from === 'assistant' && message.isCompleted">
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
      </template>
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
</template>
