<script setup lang="ts">
import { DropdownMenu } from '@/components/ai-bot/ui/dropdown-menu'
</script>

<template>
  <DropdownMenu v-bind="$attrs">
    <slot />
  </DropdownMenu>
</template>
