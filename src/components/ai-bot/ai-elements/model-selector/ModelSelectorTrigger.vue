<script setup lang="ts">
import { DropdownMenuTrigger } from '@/components/ai-bot/ui/dropdown-menu'
</script>

<template>
  <DropdownMenuTrigger v-bind="$attrs">
    <slot />
  </DropdownMenuTrigger>
</template>
