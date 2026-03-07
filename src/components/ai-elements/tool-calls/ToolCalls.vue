<script setup lang="ts">
import type { ToolCallDisplay } from '@/components/ai-bot/types/chat'
import { cn } from '@/lib/utils'
import { Code } from 'lucide-vue-next'

interface Props {
  toolCalls?: ToolCallDisplay[]
  class?: string
}

defineProps<Props>()
</script>

<template>
  <div v-if="toolCalls && toolCalls.length > 0" :class="cn('not-prose my-2 space-y-2', props.class)">
    <div
      v-for="toolCall in toolCalls"
      :key="toolCall.id"
      class="rounded-lg border border-border bg-muted/50 p-3 text-sm"
    >
      <div class="flex items-center gap-2 mb-2">
        <Code class="size-4 text-primary" />
        <span class="font-medium text-primary">{{ toolCall.name }}</span>
      </div>
      <pre class="overflow-x-auto rounded bg-muted p-2 text-xs">{{ toolCall.args }}</pre>
    </div>
  </div>
</template>
