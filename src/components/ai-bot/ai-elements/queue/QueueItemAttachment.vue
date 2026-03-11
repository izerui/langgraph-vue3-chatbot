<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/components/ai-bot/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('mt-1 flex flex-wrap gap-2', props.class)">
    <slot />
  </div>
</template>
