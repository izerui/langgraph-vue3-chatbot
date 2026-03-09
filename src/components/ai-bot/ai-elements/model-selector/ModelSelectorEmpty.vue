<script setup lang="ts">
import { CommandEmpty } from '@/components/ai-bot/ui/command'
</script>

<template>
  <CommandEmpty v-bind="$attrs">
    <slot />
  </CommandEmpty>
</template>
