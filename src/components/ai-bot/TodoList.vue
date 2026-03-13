<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronsDown, ChevronsUp, CircleCheckBig, CircleDashed, CircleDotDashed } from 'lucide-vue-next'
import type { ToolEventPayload } from './lib/tool-events'

export interface TodoItem {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface Props {
  initialTodos?: RawTodo[]
  toolEvents?: ToolEventPayload[]
}

const props = withDefaults(defineProps<Props>(), {
  initialTodos: () => [],
  toolEvents: () => []
})

const todos = ref<TodoItem[]>([])
const processedEventCount = ref(0)
const completedCount = computed(() => todos.value.filter(todo => todo.status === 'completed').length)
const allCompleted = computed(() => todos.value.length > 0 && completedCount.value === todos.value.length)

const expanded = ref(true)

function toggleExpanded() {
  expanded.value = !expanded.value
}

function isWriteTodosTool(toolName?: string): boolean {
  return (toolName || '') === 'write_todos'
}

function normalizeTodoStatus(rawStatus: unknown, fallback: TodoItem['status']): TodoItem['status'] {
  const status = String(rawStatus || '').toLowerCase()
  if (status === 'completed') return 'completed'
  if (status === 'in_progress') return 'in_progress'
  if (status === 'pending') return 'pending'
  return fallback
}

function statusByPhase(event: ToolEventPayload): TodoItem['status'] {
  if (event.state === 'completed') return 'completed'
  if (event.phase === 'tool_call_started') return 'pending'
  return 'in_progress'
}

type RawTodo = {
  id?: string
  title?: string
  task?: string
  content?: string
  text?: string
  name?: string
  status?: string
  state?: string
}

function mapRawTodos(rawTodos: RawTodo[], fallbackState: TodoItem['status'] = 'pending'): TodoItem[] {
  return rawTodos.map((todo, index) => ({
    id: todo.id || `todo-${index + 1}`,
    title: todo.title || todo.task || todo.content || todo.text || todo.name || '',
    status: normalizeTodoStatus(todo.status || todo.state, fallbackState)
  })).filter(todo => todo.title)
}

function parseRawTodoItems(raw?: string): RawTodo[] {
  if (!raw) return []

  try {
    const payload = JSON.parse(raw) as
      | RawTodo
      | RawTodo[]
      | { todo?: RawTodo; todos?: RawTodo[]; item?: RawTodo; items?: RawTodo[] }

    return Array.isArray(payload)
      ? payload
      : Array.isArray(payload.todos)
        ? payload.todos
        : Array.isArray(payload.items)
          ? payload.items
          : payload.todo
            ? [payload.todo]
            : payload.item
              ? [payload.item]
              : []
  } catch {
    return []
  }
}

function parseToolTodos(raw?: string, fallbackState: TodoItem['status'] = 'pending'): TodoItem[] {
  const rawTodos = parseRawTodoItems(raw)
  return mapRawTodos(rawTodos, fallbackState)
}

function replaceWriteTodos(raw?: string, fallbackState: TodoItem['status'] = 'pending') {
  const nextTodos = parseToolTodos(raw, fallbackState)
  if (nextTodos.length === 0) return false

  todos.value = nextTodos
  return true
}

function applyToolEvent(event: ToolEventPayload) {
  const fallbackState = statusByPhase(event)

  if (!isWriteTodosTool(event.name)) return

  // write_todos 的结构化数据只看 args；result 只是日志文本，不参与待办解析。
  replaceWriteTodos(event.args, fallbackState)
}

watch(
  () => props.initialTodos,
  (rawTodos) => {
    todos.value = mapRawTodos(rawTodos || [])
  },
  { deep: true, immediate: true }
)

watch(
  () => props.toolEvents,
  (events) => {
    if (!events.length) {
      processedEventCount.value = 0
      return
    }

    if (events.length < processedEventCount.value) {
      todos.value = []
      processedEventCount.value = 0
    }

    const nextEvents = events.slice(processedEventCount.value)
    nextEvents.forEach((event) => {
      // TodoList 自己消费 todo 相关工具事件，列表状态和渲染逻辑保持在组件内部。
      applyToolEvent(event)
    })
    processedEventCount.value = events.length
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div v-if="todos.length" class="todo-section">
    <div class="todo-card">
      <div
        class="todo-divider"
        @click="toggleExpanded"
      >
        <div class="title">
          <component
            :is="expanded ? ChevronsDown : ChevronsUp"
            :size="14"
            class="title-chevron"
          />
          <span class="title-label">执行计划</span>
          <span class="title-summary">{{ completedCount }}/{{ todos.length }}</span>
        </div>
      </div>

      <div v-show="expanded" class="todo-list">

        <div
          v-for="(todo, index) in todos"
          :key="todo.id"
          class="todo-item"
        >

          <div class="todo-row">
            <div
              class="todo-content"
              :class="{
                completed: todo.status === 'completed',
                pending: todo.status === 'pending',
                'in-progress': todo.status === 'in_progress'
              }"
            >
              <span class="todo-index">{{ index + 1 }}.</span>

              <span class="indicator" aria-hidden="true">
                <CircleDashed
                  v-if="todo.status === 'pending'"
                  :size="14"
                  class="status-icon pending-icon"
                />
                <CircleDotDashed
                  v-if="todo.status === 'in_progress'"
                  :size="14"
                  class="status-icon in-progress-icon"
                />
                <CircleCheckBig
                  v-if="todo.status === 'completed'"
                  :size="14"
                  class="status-icon completed-icon"
                />
              </span>

              <div class="title-text">
                {{ todo.title }}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-section {
  padding: 2px 12px 2px;
}

.todo-card {
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.98)),
    rgba(255, 255, 255, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    0 4px 14px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.todo-divider {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 4px;
  cursor: pointer;
  user-select: none;
  gap: 10px;
}

.title {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.title-chevron {
  color: rgba(100, 116, 139, 0.78);
}

.title-label {
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.86);
  margin-right: 4px;
}

.title-summary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  background: rgba(241, 245, 249, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.95);
  color: rgba(51, 65, 85, 0.86);
}

.todo-list {
  padding: 2px 6px 6px;
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.34) transparent;
}

.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.28);
  border-radius: 999px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}

.todo-item {
  padding: 4px 8px;
}

.todo-row {
  display: flex;
  align-items: center;
  gap: 0;
}

.todo-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 6px;
}

.todo-index {
  min-width: 14px;
  text-align: right;
  flex-shrink: 0;
}

.indicator {
  width: 16px;
  height: 16px;
  border: 0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  flex-shrink: 0;
  padding: 0;
  pointer-events: none;
}

.status-icon {
  display: block;
}

.todo-index,
.title-text {
  font-size: 13px;
  line-height: 1.35;
  color: rgba(15, 23, 42, 0.88);
}

.title-text {
}

.todo-content.completed .title-text {
  color: rgba(22, 101, 52, 0.92);
  font-weight: 600;
}

.todo-index {
  color: rgba(148, 163, 184, 0.7);
  font-size: 11px;
}

.completed .indicator {
  color: #059669;
}

.pending .indicator {
  color: rgba(0, 0, 0, 0.5);
}

.in-progress .indicator {
  color: #f59e0b;
}

.completed-icon {
  color: #059669;
}

.pending-icon {
  color: rgba(0, 0, 0, 0.5);
}

.in-progress-icon {
  color: #f59e0b;
}

</style>
