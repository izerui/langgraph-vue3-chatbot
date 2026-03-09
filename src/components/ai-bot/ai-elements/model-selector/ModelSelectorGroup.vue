<script setup lang="ts">
import { CommandGroup } from '@/components/ai-bot/ui/command'
</script>

<template>
  <CommandGroup v-bind="$attrs">
    <slot />
  </CommandGroup>
</template>
