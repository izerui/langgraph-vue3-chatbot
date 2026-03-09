<script setup lang="ts">
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
</script>

<template>
  <DropdownMenuTrigger v-bind="$attrs">
    <slot />
  </DropdownMenuTrigger>
</template>
