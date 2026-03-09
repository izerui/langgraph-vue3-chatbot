<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CommandList } from '@/components/ai-bot/ui/command'
import { cn } from '@/components/ai-bot/lib/utils'

type PromptInputCommandListProps = InstanceType<typeof CommandList>['$props']

interface Props extends /* @vue-ignore */ PromptInputCommandListProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <CommandList :class="cn(props.class)" v-bind="props" />
</template>
