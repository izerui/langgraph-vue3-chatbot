<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/components/ai-bot/lib/utils'
import { computed } from 'vue'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const classes = computed(() => cn(
  'flex flex-col p-4', //这里就是对话整个矩形区域 'flex flex-col p-4 border border-border rounded-lg',
  props.class,
))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
