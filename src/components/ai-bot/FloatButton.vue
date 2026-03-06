<script setup lang="ts">
interface Props {
  isExpanded: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button class="float-button" @click="emit('toggle')" type="button">
    <svg v-if="isExpanded" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
    <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  </button>
</template>

<style scoped>
.float-button {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--primary);
  border: none;
  cursor: pointer;
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.float-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}
</style>
