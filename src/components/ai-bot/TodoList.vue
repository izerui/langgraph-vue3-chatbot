<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronsDown, ChevronsUp, CircleCheckBig, CircleDashed, CircleDotDashed } from 'lucide-vue-next'
import type { ToolEventPayload } from './lib/tool-events'

export interface TodoItem {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface Props {
  toolEvent?: ToolEventPayload | null
}

const props = withDefaults(defineProps<Props>(), {
  toolEvent: null
})

const todos = ref<TodoItem[]>([])

const expanded = ref(false)

function toggleExpanded() {
  expanded.value = !expanded.value
}

function toggleTodo(id: string) {
  todos.value = todos.value.map(todo =>
    todo.id === id
      ? { ...todo, status: todo.status === 'completed' ? 'pending' : 'completed' }
      : todo
  )
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

  return rawTodos.map((todo, index) => ({
    id: todo.id || `todo-${index + 1}`,
    title: todo.title || todo.task || todo.content || todo.text || todo.name || '',
    status: normalizeTodoStatus(todo.status || todo.state, fallbackState)
  })).filter(todo => todo.title)
}

function mergeWriteTodos(raw?: string, fallbackState: TodoItem['status'] = 'pending') {
  const updates = parseToolTodos(raw, fallbackState)
  if (updates.length === 0) return false

  if (todos.value.length === 0) {
    todos.value = updates
    return true
  }

  let hasMatchedExisting = false

  todos.value = todos.value.map(existing => {
    const matched = updates.find(update =>
      (update.id && update.id === existing.id)
      || (update.title && update.title === existing.title)
    )

    if (!matched) return existing
    hasMatchedExisting = true

    return {
      ...existing,
      title: matched.title || existing.title,
      status: matched.status
    }
  })

  if (!hasMatchedExisting) {
    todos.value = updates
  }

  return true
}

function applyToolEvent(event: ToolEventPayload) {
  const fallbackState = statusByPhase(event)

  if (!isWriteTodosTool(event.name)) return

  // write_todos 的结构化数据只看 args；result 只是日志文本，不参与待办解析。
  mergeWriteTodos(event.args, fallbackState)
}

watch(
  () => props.toolEvent,
  (event) => {
    if (!event) return
    // TodoList 自己消费 todo 相关工具事件，列表状态和渲染逻辑保持在组件内部。
    applyToolEvent(event)
  }
)
</script>

<template>
  <div v-if="todos.length" class="todo-section">

    <!-- 分割线标题 -->
    <div class="todo-divider" @click="toggleExpanded">

      <div class="line"></div>

      <div class="title">
        <span class="title-text-main">待办事项 ({{ todos.length }})</span>

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
          v-for="(todo, index) in todos"
          :key="todo.id"
          class="todo-item"
          :class="{
            completed: todo.status === 'completed',
            pending: todo.status === 'pending',
            'in-progress': todo.status === 'in_progress'
          }"
        >

          <div class="todo-row">

            <span class="todo-index">{{ index + 1 }}.</span>

            <!-- 状态按钮 -->
            <button
              class="indicator"
              @click.stop="toggleTodo(todo.id)"
            >
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

.status-icon {
  display: block;
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
  color: #16a34a;
}

.pending .indicator {
  color: rgba(0, 0, 0, 0.5);
}

.in-progress .indicator {
  color: #f59e0b;
}

.completed-icon {
  color: #16a34a;
}

.pending-icon {
  color: rgba(0, 0, 0, 0.5);
}

.in-progress-icon {
  color: #f59e0b;
}

</style>
