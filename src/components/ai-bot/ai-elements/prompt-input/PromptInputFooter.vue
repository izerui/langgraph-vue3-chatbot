<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { InputGroupAddon } from '@/components/ai-bot/ui/input-group'
import { cn } from '@/components/ai-bot/lib/utils'

type PromptInputFooterProps = InstanceType<typeof InputGroupAddon>['$props']

interface Props extends /* @vue-ignore */ Omit<PromptInputFooterProps, 'align'> {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <InputGroupAddon
    align="block-end"
    :class="cn('justify-between gap-1', props.class)"
    v-bind="props"
  >
    <slot />
  </InputGroupAddon>
</template>
