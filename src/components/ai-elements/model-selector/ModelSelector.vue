<script setup lang="ts">
import { DropdownMenu } from '@/components/ui/dropdown-menu'
</script>

<template>
  <DropdownMenu v-bind="$attrs">
    <slot />
  </DropdownMenu>
</template>
