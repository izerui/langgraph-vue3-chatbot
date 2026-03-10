<script setup lang="ts">
import type { ToolUIInfo } from './types/chat'
import { ChevronDownIcon, PlayCircle, Loader, CheckCircle, XCircle } from 'lucide-vue-next'
import { cn } from '@/components/ai-bot/lib/utils'
import { ref } from 'vue'

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

const formatArgs = (args: string, maxLength = 30) => {
  try {
    const parsed = JSON.parse(args)
    const str = JSON.stringify(parsed)
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + '...'
    }
    return str
  } catch {
    return args.length > maxLength ? args.slice(0, maxLength) + '...' : args
  }
}

const openStates = ref<Record<string, boolean>>({})

const toggle = (id: string) => {
  openStates.value[id] = !openStates.value[id]
}
</script>

<template>
  <div class="mb-3 text-xs max-w-full">
    <div
      v-for="tool in toolCalls"
      :key="tool.id"
      class="overflow-hidden"
    >
      <div
        class="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-2 py-1.5 transition-colors cursor-pointer"
        @click="toggle(tool.id)"
      >
        <ChevronDownIcon
          class="h-4 w-4 shrink-0 transition-transform"
          :class="openStates[tool.id] ? 'rotate-0' : 'rotate-[-90deg]'"
        />
        <span class="font-medium">{{ tool.name }}</span>
        <span
          class="text-muted-foreground truncate max-w-[120px]"
          :title="tool.args"
        >{{ formatArgs(tool.args) }}</span>
        <component
          :is="getStateIcon(tool.state).icon"
          :class="cn('h-3 w-3 shrink-0 ml-auto', getStateIcon(tool.state).color)"
        />
      </div>
      <div
        v-show="openStates[tool.id]"
        class="mt-2 ml-6 flex flex-col gap-2"
      >
        <div>
          <p class="text-muted-foreground mb-1">Arguments:</p>
          <pre class="bg-muted p-2 rounded text-[10px] overflow-x-auto max-w-full">{{ tool.args }}</pre>
        </div>
        <div v-if="tool.result || tool.error">
          <p class="text-muted-foreground mb-1">
            {{ tool.state === 'error' ? 'Error:' : 'Result:' }}
          </p>
          <pre
            :class="
              cn(
                'bg-muted p-2 rounded text-[10px] overflow-x-auto max-w-full',
                tool.state === 'error' && 'text-red-500'
              )
            "
          >{{ tool.error || tool.result }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
