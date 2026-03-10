<script setup lang="ts">
import { BotMessageSquare, BotOff } from 'lucide-vue-next'

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
      <BotOff class="icon-svg" />
    </span>
  </button>
</template>

<style scoped>
.float-button {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
}

.float-button:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.float-button:active {
  transform: scale(0.95);
}

.icon-wrapper {
  position: relative;
  width: 30px;
  height: 30px;
}

.icon-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
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
