<script setup lang="ts">
import { CommandList } from '@/components/ai-bot/ui/command'
</script>

<template>
  <CommandList v-bind="$attrs">
    <slot />
  </CommandList>
</template>
