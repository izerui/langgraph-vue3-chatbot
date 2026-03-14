<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronsDown, ChevronsUp, Circle, CircleCheckBig, LoaderCircle } from 'lucide-vue-next'
import type { ToolEventPayload } from './lib/tool-events'
import { Shimmer } from './ai-elements/shimmer'

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
const inProgressCount = computed(() => todos.value.filter(todo => todo.status === 'in_progress').length)
const pendingCount = computed(() => todos.value.filter(todo => todo.status === 'pending').length)

const expanded = ref(false)
const userCollapsed = ref(false)

function toggleExpanded() {
  expanded.value = !expanded.value
  userCollapsed.value = !expanded.value
}

function syncExpandedWithTodos(nextTodos: TodoItem[]) {
  if (nextTodos.length === 0) {
    expanded.value = false
    userCollapsed.value = false
    return
  }

  // 首次出现待办或仍处于自动模式时，随着流式更新保持展开。
  if (!userCollapsed.value) {
    expanded.value = true
  }
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
  syncExpandedWithTodos(nextTodos)
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
    const nextTodos = mapRawTodos(rawTodos || [])
    todos.value = nextTodos
    syncExpandedWithTodos(nextTodos)
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
      syncExpandedWithTodos([])
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
            :size="13"
            class="title-chevron"
          />
          <span class="title-label">执行计划</span>
          <span class="title-summary">{{ completedCount }}/{{ todos.length }}</span>
          <span class="title-meta">
            {{ inProgressCount > 0 ? `进行中 ${inProgressCount}` : pendingCount > 0 ? `待处理 ${pendingCount}` : '已完成' }}
          </span>
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
                <Circle
                  v-if="todo.status === 'pending'"
                  :size="13"
                  class="status-icon pending-icon"
                />
                <LoaderCircle
                  v-if="todo.status === 'in_progress'"
                  :size="13"
                  class="status-icon in-progress-icon"
                />
                <CircleCheckBig
                  v-if="todo.status === 'completed'"
                  :size="13"
                  class="status-icon completed-icon"
                />
              </span>

              <Shimmer
                v-if="todo.status === 'in_progress'"
                as="div"
                class="title-text-base title-text-shimmer"
              >
                {{ todo.title }}
              </Shimmer>

              <div v-else class="title-text-base title-text">
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
  padding: 2px 12px 0;
}

.todo-card {
  --todo-surface: rgba(255, 252, 247, 0.96);
  --todo-surface-strong: rgba(255, 255, 255, 0.98);
  --todo-border: rgba(215, 221, 232, 0.92);
  --todo-divider: rgba(230, 234, 241, 0.9);
  --todo-title: rgba(37, 52, 72, 0.92);
  --todo-muted: rgba(104, 118, 138, 0.86);
  --todo-summary-bg: rgba(243, 247, 252, 0.96);
  --todo-summary-border: rgba(220, 228, 239, 0.96);
  --todo-summary-text: rgba(66, 84, 108, 0.92);
  --todo-hover: rgba(245, 248, 252, 0.88);
  --todo-text: rgba(31, 41, 55, 0.9);
  --todo-index: rgba(148, 163, 184, 0.9);
  --todo-pending: rgba(107, 114, 128, 0.8);
  --todo-progress: #d97706;
  --todo-completed: #0f9f6e;
  --todo-completed-text: rgba(17, 94, 69, 0.92);
  border-radius: 6px;
  border: 1px solid var(--todo-border);
  background:
    linear-gradient(180deg, var(--todo-surface-strong), var(--todo-surface)),
    var(--todo-surface-strong);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 4px 12px rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.todo-divider {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid transparent;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.todo-divider:hover {
  background: var(--todo-hover);
}

.title {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.title-chevron {
  color: var(--todo-muted);
}

.title-label {
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  color: var(--todo-title);
  margin-right: 4px;
  letter-spacing: 0.01em;
}

.title-summary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  background: var(--todo-summary-bg);
  border: 1px solid var(--todo-summary-border);
  color: var(--todo-summary-text);
}

.title-meta {
  font-size: 11px;
  line-height: 1;
  color: var(--todo-muted);
}

.todo-list {
  padding: 0 6px 6px;
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(186, 196, 211, 0.5) transparent;
  border-top: 1px solid var(--todo-divider);
}

.todo-list::-webkit-scrollbar {
  width: 6px;
}

.todo-list::-webkit-scrollbar-thumb {
  background: rgba(186, 196, 211, 0.42);
  border-radius: 999px;
}

.todo-list::-webkit-scrollbar-thumb:hover {
  background: rgba(160, 174, 192, 0.58);
}

.todo-item {
  padding: 3px 8px;
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
.title-text-base {
  font-size: 13px;
  line-height: 1.35;
}

.title-text {
  color: var(--todo-text);
}

.title-text-shimmer {
  --color-muted-foreground: rgba(120, 53, 15, 0.42);
  --color-background: rgba(217, 119, 6, 0.92);
}

.todo-content.pending .title-text,
.todo-content.in-progress .title-text-shimmer,
.todo-content.completed .title-text {
  font-size: 12px;
  line-height: 1.35;
}

.todo-content.completed .title-text {
  color: var(--todo-completed-text);
}

.todo-index {
  color: var(--todo-index);
  font-size: 11px;
}

.completed .indicator {
  color: var(--todo-completed);
}

.pending .indicator {
  color: var(--todo-pending);
}

.in-progress .indicator {
  color: var(--todo-progress);
}

.completed-icon {
  color: var(--todo-completed);
}

.pending-icon {
  color: var(--todo-pending);
}

.in-progress-icon {
  color: var(--todo-progress);
  animation: todo-spin 1.4s linear infinite;
}

@keyframes todo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

</style>
