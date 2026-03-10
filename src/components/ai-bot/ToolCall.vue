<script setup lang="ts">
import type { ToolUIInfo } from './types/chat'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ai-bot/ui/collapsible'
import { ChevronDownIcon, PlayCircle, Loader, CheckCircle, XCircle } from 'lucide-vue-next'
import { cn } from '@/components/ai-bot/lib/utils'

defineProps<{
  toolCalls: ToolUIInfo[]
}>()

const getStateIcon = (state: string) => {
  switch (state) {
    case 'start':
      return { icon: PlayCircle, color: 'text-blue-500' }
    case 'running':
      return { icon: Loader, color: 'text-yellow-500 animate-spin' }
    case 'completed':
      return { icon: CheckCircle, color: 'text-green-500' }
    case 'error':
      return { icon: XCircle, color: 'text-red-500' }
    default:
      return { icon: PlayCircle, color: 'text-muted-foreground' }
  }
}
</script>

<template>
  <Collapsible
    v-for="tool in toolCalls"
    :key="tool.id"
    v-slot="{ open }"
    class="mb-3 text-xs"
  >
    <CollapsibleTrigger
      :class="cn('flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-2 py-1.5 transition-colors')"
    >
      <ChevronDownIcon
        class="h-4 w-4 shrink-0 transition-transform"
        :class="open ? 'rotate-0' : 'rotate-[-90deg]'"
      />
      <span class="font-medium flex-1">{{ tool.name }}</span>
      <component
        :is="getStateIcon(tool.state).icon"
        :class="cn('h-4 w-4 shrink-0', getStateIcon(tool.state).color)"
      />
    </CollapsibleTrigger>
    <CollapsibleContent
      :class="
        cn(
          'mt-2 ml-6 flex flex-col gap-2',
          'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in'
        )
      "
    >
      <div>
        <p class="text-muted-foreground mb-1">Arguments:</p>
        <pre class="bg-muted p-2 rounded text-[10px] overflow-x-auto">{{ tool.args }}</pre>
      </div>
      <div v-if="tool.result || tool.error">
        <p class="text-muted-foreground mb-1">
          {{ tool.state === 'error' ? 'Error:' : 'Result:' }}
        </p>
        <pre
          :class="
            cn(
              'bg-muted p-2 rounded text-[10px] overflow-x-auto',
              tool.state === 'error' && 'text-red-500'
            )
          "
        >{{ tool.error || tool.result }}</pre>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
