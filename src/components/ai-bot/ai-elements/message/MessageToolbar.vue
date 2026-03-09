<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/components/ai-bot/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="
      cn(
        'flex w-full items-center justify-between gap-4',
        props.class,
      )
    "
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
