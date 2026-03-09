<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { HoverCardContent } from '@/components/ai-bot/ui/hover-card'
import { cn } from '@/components/ai-bot/lib/utils'

type AttachmentHoverCardContentProps = InstanceType<typeof HoverCardContent>['$props']

interface Props extends /* @vue-ignore */ AttachmentHoverCardContentProps {
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  align: 'start',
})
</script>

<template>
  <HoverCardContent :class="cn('w-auto p-2', props.class)" v-bind="props">
    <slot />
  </HoverCardContent>
</template>
