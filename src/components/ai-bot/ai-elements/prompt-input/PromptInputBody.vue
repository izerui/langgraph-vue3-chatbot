<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/components/ai-bot/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div :class="cn('contents', props.class)" v-bind="props">
    <slot />
  </div>
</template>
