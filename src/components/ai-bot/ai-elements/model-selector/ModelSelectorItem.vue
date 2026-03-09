<script setup lang="ts">
import { CommandItem } from '@/components/ai-bot/ui/command'

const props = defineProps<{
  value: string
}>()
</script>

<template>
  <CommandItem v-bind="$attrs" :value="props.value">
    <slot />
  </CommandItem>
</template>
