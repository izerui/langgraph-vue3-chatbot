<script setup lang="ts">
import { Suggestion, Suggestions } from '@/components/ai-bot/ai-elements/suggestion'

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
    <Suggestions class="suggestions-list">
      <Suggestion
        v-for="suggestion in suggestions"
        :key="suggestion"
        :suggestion="suggestion"
        class="suggestion-chip"
        @click="emit('select', suggestion)"
      />
    </Suggestions>
  </div>
</template>

<style scoped>
.suggestions-wrapper {
  padding: 0;
}

:deep(.suggestions-list) {
  justify-content: flex-start;
  gap: 5px;
}

:deep(.suggestion-chip) {
  height: 24px;
  padding: 0 9px;
  border-color: rgba(226, 232, 240, 0.72);
  background: rgba(248, 250, 252, 0.55);
  color: rgba(100, 116, 139, 0.92);
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
  box-shadow: none;
}

:deep(.suggestion-chip:hover) {
  background: rgba(241, 245, 249, 0.78);
  border-color: rgba(203, 213, 225, 0.78);
}
</style>
