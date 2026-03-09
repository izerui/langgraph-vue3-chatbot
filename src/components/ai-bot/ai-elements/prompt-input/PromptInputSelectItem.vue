<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectItem } from '@/components/ai-bot/ui/select'
import { cn } from '@/components/ai-bot/lib/utils'

type PromptInputSelectItemProps = InstanceType<typeof SelectItem>['$props']

interface Props extends /* @vue-ignore */ PromptInputSelectItemProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <SelectItem :class="cn(props.class)" v-bind="props">
    <slot />
  </SelectItem>
</template>
