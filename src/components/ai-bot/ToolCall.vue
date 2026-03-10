<script setup lang="ts">
import type { ToolCall } from './lib/types'
import { ChevronDownIcon, PlayCircle, Loader, CheckCircle, XCircle, BrainIcon, GlobeIcon, FileTextIcon, FolderSearch, FileEditIcon, ListTodoIcon, EyeIcon, SquarePen, FileSearch, BookOpenCheck, FolderSearchIcon, ZapIcon, WrenchIcon } from 'lucide-vue-next'
import { cn } from '@/components/ai-bot/lib/utils'
import { ref } from 'vue'

defineProps<{
  toolCalls: ToolCall[]
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

const toolNameMap: Record<string, string> = {
  think_tool: '战略反思',
  fetch_markdown: '获取网页',
  convert_to_markdown: '文件转换',
  ls: '列出目录',
  read_file: '读取文件',
  write_file: '写入文件',
  edit_file: '编辑文件',
  glob: '查找文件',
  grep: '搜索文本',
  execute: '执行命令',
  write_todos: '待办事项',
  task: '子任务',
}

const toolIconMap: Record<string, any> = {
  think_tool: BrainIcon,
  fetch_markdown: GlobeIcon,
  convert_to_markdown: FileTextIcon,
  ls: FolderSearchIcon,
  read_file: EyeIcon,
  write_file: FileEditIcon,
  edit_file: SquarePen,
  glob: FolderSearch,
  grep: FileSearch,
  execute: ZapIcon,
  write_todos: ListTodoIcon,
  task: BookOpenCheck,
}

const getToolName = (name: string) => {
  return toolNameMap[name] || name
}

const getToolIcon = (name: string) => {
  return toolIconMap[name] || WrenchIcon
}

// 简化 args 展示，只取前100个字符
const formatArgs = (args: string) => {
  if (!args) return ''
  return args.length > 50 ? args.slice(0, 100) + '...' : args
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
          class="h-4 w-4 shrink-0"
          :class="openStates[tool.id] ? '' : '-rotate-90'"
        />
        <component
          :is="getToolIcon(tool.name)"
          class="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        />
        <span class="font-medium">{{ getToolName(tool.name) }}</span>
        <span class="text-muted-foreground truncate flex-1 min-w-0">{{ formatArgs(tool.args) }}</span>
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
          <p class="text-muted-foreground mb-1">请求:</p>
          <pre class="bg-muted p-2 rounded text-[10px] overflow-x-auto max-w-full">{{ tool.args }}</pre>
        </div>
        <div v-if="tool.result || tool.error">
          <p class="text-muted-foreground mb-1">
            {{ tool.state === 'error' ? 'Error:' : '结果:' }}
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
