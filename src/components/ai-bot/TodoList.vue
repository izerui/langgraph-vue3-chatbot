<script setup lang="ts">
import { ref } from 'vue'
import { ChevronsDown, ChevronsUp, Check } from 'lucide-vue-next'

export interface TodoItem {
  id: string
  title: string
  status: 'pending' | 'completed'
}

interface Props {
  todos?: TodoItem[]
}

const props = withDefaults(defineProps<Props>(), {
  todos: () => []
})

const emit = defineEmits<{
  toggle: [id: string]
}>()

const expanded = ref(false)

function toggleExpanded() {
  expanded.value = !expanded.value
}

function toggleTodo(id: string) {
  emit('toggle', id)
}
</script>

<template>
  <div v-if="props.todos.length" class="todo-section">

    <!-- 分割线标题 -->
    <div class="todo-divider" @click="toggleExpanded">

      <div class="line"></div>

      <div class="title">
        <span class="title-text-main">待办事项 ({{ props.todos.length }})</span>

        <component
          :is="expanded ? ChevronsDown : ChevronsUp"
          :size="14"
        />
      </div>

      <div class="line"></div>

    </div>

    <!-- 列表 -->
    <div v-show="expanded" class="todo-list">

        <div
          v-for="(todo, index) in props.todos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.status === 'completed' }"
        >

          <div class="todo-row">

            <span class="todo-index">{{ index + 1 }}.</span>

            <!-- 状态按钮 -->
            <button
              class="indicator"
              @click.stop="toggleTodo(todo.id)"
            >
              <Check
                v-if="todo.status === 'completed'"
                :size="12"
                class="check-icon"
              />
            </button>

            <!-- 标题 -->
            <div class="title-text">
              {{ todo.title }}
            </div>

          </div>

        </div>

    </div>

  </div>
</template>

<style scoped>

/* 整体 */

.todo-section {
  padding: 0 16px;
  background: var(--background);
}

/* 分割线标题 */

.todo-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
}

.todo-divider:hover .title-text-main {
  opacity: 1;
}

/* 两侧线 */

.line {
  flex: 1;
  height: 1px;
  background: rgba(0,0,0,0.08);
}

/* 标题 */

.title {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.title-text-main {
  font-size: 13px;
  line-height: 1.4;
  color: var(--foreground);
  opacity: 0.6;
}

/* 列表 */

.todo-list {
  padding-top: 6px;
  max-height: 140px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.2) transparent;
}

.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 999px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.3);
}

/* 单条 */

.todo-item {
  padding: 6px 10px;
  border-radius: 6px;
}

.todo-item:hover {
  background: rgba(0,0,0,0.03);
}

.todo-item:hover .todo-index,
.todo-item:hover .title-text {
  opacity: 1;
}

/* 行 */

.todo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.todo-index {
  min-width: 20px;
  text-align: right;
  flex-shrink: 0;
}

/* indicator */

.indicator {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.indicator:hover {
  border-color: rgba(0,0,0,0.4);
}

/* 标题 */

.todo-index,
.title-text {
  font-size: 13px;
  line-height: 1.4;
  color: var(--foreground);
  opacity: 0.6;
}

.completed .title-text {
  text-decoration: line-through;
}

/* 绿色完成状态 */

.completed .indicator {
  background: #22c55e;
  border-color: #22c55e;
  color: white;
}

.check-icon {
  color: white;
}

</style>
