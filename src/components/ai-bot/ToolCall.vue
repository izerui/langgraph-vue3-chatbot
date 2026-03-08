<script setup lang="ts">
import type { ToolUIInfo } from './types/chat'
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

defineProps<{
  toolCalls: ToolUIInfo[]
}>()
</script>

<template>
  <Sandbox
    v-for="tool in toolCalls"
    :key="tool.id"
  >
    <SandboxHeader :state="tool.state" :title="tool.name" />
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
            :code="tool.args"
            language="python"
          >
            <CodeBlockCopyButton class="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </CodeBlock>
        </SandboxTabContent>
        <SandboxTabContent value="output">
          <CodeBlock
            v-if="tool.state === 'output-error'"
            class="border-0 text-red-500"
            :code="tool.error || ''"
            language="javascript"
          >
            <CodeBlockCopyButton class="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </CodeBlock>
          <CodeBlock
            v-else
            class="border-0"
            :code="tool.result || ''"
            language="log"
          >
            <CodeBlockCopyButton class="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </CodeBlock>
        </SandboxTabContent>
      </SandboxTabs>
    </SandboxContent>
  </Sandbox>
</template>
