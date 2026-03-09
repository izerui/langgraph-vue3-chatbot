<script setup lang="ts">
import { CommandShortcut } from '@/components/ai-bot/ui/command'
</script>

<template>
  <CommandShortcut v-bind="$attrs">
    <slot />
  </CommandShortcut>
</template>
