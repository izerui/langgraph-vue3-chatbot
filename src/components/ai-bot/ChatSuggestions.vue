<script setup lang="ts">
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'

interface Props {
  suggestions: string[]
}

defineProps<Props>()

const emit = defineEmits<{
  select: [suggestion: string]
}>()
</script>

<template>
  <div class="suggestions-wrapper">
    <Suggestions>
      <Suggestion
        v-for="suggestion in suggestions"
        :key="suggestion"
        :suggestion="suggestion"
        @click="emit('select', suggestion)"
      />
    </Suggestions>
  </div>
</template>

<style scoped>
.suggestions-wrapper {
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--background);
  flex-shrink: 0;
}
</style>
