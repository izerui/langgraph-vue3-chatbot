<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/components/ai-bot/lib/utils'
import { reactiveOmit } from '@vueuse/core'
import { StickToBottom } from 'vue-stick-to-bottom'

interface Props {
  ariaLabel?: string
  class?: HTMLAttributes['class']
  initial?: boolean | 'instant' | { damping?: number, stiffness?: number, mass?: number }
  resize?: 'instant' | { damping?: number, stiffness?: number, mass?: number }
  damping?: number
  stiffness?: number
  mass?: number
  anchor?: 'auto' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Conversation',
  initial: true,
  damping: 0.7,
  stiffness: 0.05,
  mass: 1.25,
  anchor: 'none',
})
const delegatedProps = reactiveOmit(props, 'class')
</script>

<style scoped>
:deep(> div) {
  scrollbar-width: thin;
  scrollbar-color: var(--ai-scrollbar-thumb) transparent;
}

:deep(> div::-webkit-scrollbar) {
  width: 6px;
}

:deep(> div::-webkit-scrollbar-thumb) {
  background: var(--ai-scrollbar-thumb);
  border-radius: 999px;
}

:deep(> div::-webkit-scrollbar-thumb:hover) {
  background: var(--ai-scrollbar-thumb-hover);
}
</style>

<template>
  <StickToBottom
    v-bind="delegatedProps"
    :class="cn('relative flex-1 overflow-y-hidden', props.class)"
    role="log"
  >
    <slot />
  </StickToBottom>
</template>
