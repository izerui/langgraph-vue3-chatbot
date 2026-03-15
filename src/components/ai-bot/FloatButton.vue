<script setup lang="ts">
import { BotMessageSquare, BotOff, X } from 'lucide-vue-next'

interface Props {
  isExpanded: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button class="float-button" :class="{ expanded: isExpanded }" @click="emit('toggle')" type="button">
    <span class="icon-wrapper">
      <BotMessageSquare class="icon-svg" />
      <X :size="16" :stroke-width="2" absoluteStrokeWidth class="icon-svg"/>
<!--      <BotOff class="icon-svg" />-->
    </span>
  </button>
</template>

<style scoped>
.float-button {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--ai-fab-bg) 0%, var(--ai-fab-bg-strong) 100%);
  border: none;
  cursor: pointer;
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--ai-fab-shadow);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
}

.float-button:hover {
  transform: scale(1.05);
  box-shadow: var(--ai-fab-shadow-hover);
}

.float-button:active {
  transform: scale(0.95);
}

.icon-wrapper {
  position: relative;
  width: 24px;
  height: 24px;
}

.icon-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  transition: opacity 0.3s, transform 0.3s;
}

/* 第一个图标 - 默认显示 */
.icon-wrapper .icon-svg:first-child {
  opacity: 1;
  transform: rotate(0deg);
}

/* 第二个图标 - 默认隐藏 */
.icon-wrapper .icon-svg:last-child {
  opacity: 0;
  transform: rotate(-90deg);
}

/* 展开状态 - 交换动画 */
.float-button.expanded .icon-wrapper .icon-svg:first-child {
  opacity: 0;
  transform: rotate(90deg);
}

.float-button.expanded .icon-wrapper .icon-svg:last-child {
  opacity: 1;
  transform: rotate(0deg);
}
</style>
