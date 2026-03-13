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

const expanded = ref(true)

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
        <span>待办事项 ({{ props.todos.length }})</span>

        <component
          :is="expanded ? ChevronsUp : ChevronsDown"
          :size="14"
        />
      </div>

      <div class="line"></div>

    </div>

    <!-- 列表 -->
    <Transition name="todo-collapse">
      <div v-show="expanded" class="todo-list">

        <div
          v-for="todo in props.todos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.status === 'completed' }"
        >

          <div class="todo-row">

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
    </Transition>

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

.todo-divider:hover .title {
  opacity: 0.8;
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
  font-size: 12px;
  color: var(--foreground);
  white-space: nowrap;
}

/* 列表 */

.todo-list {
  padding-top: 6px;
}

/* 单条 */

.todo-item {
  padding: 6px 10px;
  border-radius: 6px;
}

.todo-item:hover {
  background: rgba(0,0,0,0.03);
}

/* 行 */

.todo-row {
  display: flex;
  align-items: center;
  gap: 8px;
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

.title-text {
  font-size: 13px;
  line-height: 1.4;
}

/* 完成状态 */

.completed .title-text {
  text-decoration: line-through;
  opacity: 0.6;
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

/* 动画 */

.todo-collapse-enter-active,
.todo-collapse-leave-active {
  transition: all 0.22s ease;
}

.todo-collapse-enter-from,
.todo-collapse-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

</style>