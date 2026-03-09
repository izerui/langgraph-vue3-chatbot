<script setup lang="ts">
import { CommandDialog } from '@/components/ai-bot/ui/command'
</script>

<template>
  <CommandDialog v-bind="$attrs">
    <slot />
  </CommandDialog>
</template>
