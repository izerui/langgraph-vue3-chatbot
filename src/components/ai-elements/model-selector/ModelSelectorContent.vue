<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Command } from '@/components/ui/command'
import { DropdownMenuContent } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Props {
  title?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Model Selector',
})
</script>

<template>
  <DropdownMenuContent
    :class="cn('p-0 z-[10000]', props.class)"
    v-bind="$attrs"
  >
    <Command class="**:data-[slot=command-input-wrapper]:h-auto">
      <slot />
    </Command>
  </DropdownMenuContent>
</template>
