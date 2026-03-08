<script setup lang="ts">
import type { ToolUIInfo } from './types/chat'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDownIcon, WrenchIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineProps<{
  toolCalls: ToolUIInfo[]
}>()

const getStateColor = (state: string) => {
  switch (state) {
    case 'output-error':
      return 'text-red-500'
    case 'output-available':
    case 'output-denied':
      return 'text-green-500'
    case 'input-available':
    case 'input-streaming':
      return 'text-blue-500'
    case 'approval-requested':
      return 'text-yellow-500'
    default:
      return 'text-muted-foreground'
  }
}
</script>

<template>
  <Collapsible
    v-for="tool in toolCalls"
    :key="tool.id"
    class="mb-3 text-xs"
  >
    <CollapsibleTrigger
      :class="cn('flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-2 py-1.5 transition-colors')"
    >
      <WrenchIcon class="h-4 w-4 shrink-0" />
      <span class="font-medium flex-1">{{ tool.name }}</span>
      <span :class="cn('text-[10px] uppercase', getStateColor(tool.state))">
        {{ tool.state.replace(/-/g, ' ') }}
      </span>
      <ChevronDownIcon class="h-4 w-4 shrink-0 transition-transform data-[state=closed]:rotate-[-90deg]" />
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
          {{ tool.state === 'output-error' ? 'Error:' : 'Result:' }}
        </p>
        <pre
          :class="
            cn(
              'bg-muted p-2 rounded text-[10px] overflow-x-auto',
              tool.state === 'output-error' && 'text-red-500'
            )
          "
        >{{ tool.error || tool.result }}</pre>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
