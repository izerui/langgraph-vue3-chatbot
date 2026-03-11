<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CollapsibleContent } from '@/components/ai-bot/ui/collapsible'
import { cn } from '@/components/ai-bot/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <CollapsibleContent :class="cn(props.class)">
    <slot />
  </CollapsibleContent>
</template>
