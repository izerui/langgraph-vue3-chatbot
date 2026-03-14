<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Suggestion } from '@/components/ai-bot/ai-elements/suggestion'

interface Props {
  suggestions: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [suggestion: string]
}>()

const ROTATE_INTERVAL = 3200
const CHIP_GAP = 5

const viewportRef = ref<HTMLDivElement | null>(null)
const measureRefs = ref<(HTMLElement | null)[]>([])
const pageRanges = ref<Array<{ start: number, end: number }>>([])
const currentPageIndex = ref(0)
const isHovered = ref(false)

let rotationTimer: ReturnType<typeof setInterval> | null = null
let resizeObserver: ResizeObserver | null = null

const shouldRotate = computed(() => pageRanges.value.length > 1)

const currentPageSuggestions = computed(() => {
  const range = pageRanges.value[currentPageIndex.value]
  if (!range) {
    return props.suggestions
  }
  return props.suggestions.slice(range.start, range.end)
})

function setMeasureRef(el: HTMLElement | null, index: number) {
  measureRefs.value[index] = el
}

function stopRotation() {
  if (rotationTimer) {
    clearInterval(rotationTimer)
    rotationTimer = null
  }
}

function startRotation() {
  stopRotation()

  if (!shouldRotate.value || isHovered.value) {
    return
  }

  rotationTimer = setInterval(() => {
    currentPageIndex.value = (currentPageIndex.value + 1) % pageRanges.value.length
  }, ROTATE_INTERVAL)
}

function handleMouseEnter() {
  isHovered.value = true
  stopRotation()
}

function handleMouseLeave() {
  isHovered.value = false
  startRotation()
}

function buildPageRanges() {
  const viewportWidth = viewportRef.value?.clientWidth ?? 0
  const widths = props.suggestions.map((_, index) => measureRefs.value[index]?.offsetWidth ?? 0)

  if (!props.suggestions.length) {
    pageRanges.value = []
    currentPageIndex.value = 0
    stopRotation()
    return
  }

  if (!viewportWidth || widths.some(width => width === 0)) {
    pageRanges.value = [{ start: 0, end: props.suggestions.length }]
    currentPageIndex.value = 0
    stopRotation()
    return
  }

  const ranges: Array<{ start: number, end: number }> = []
  let start = 0
  let widthSum = 0

  props.suggestions.forEach((_, index) => {
    const itemWidth = widths[index]
    const nextWidth = start === index ? itemWidth : widthSum + CHIP_GAP + itemWidth

    if (start !== index && nextWidth > viewportWidth) {
      ranges.push({ start, end: index })
      start = index
      widthSum = itemWidth
      return
    }

    widthSum = nextWidth
  })

  ranges.push({ start, end: props.suggestions.length })
  pageRanges.value = ranges
  currentPageIndex.value = Math.min(currentPageIndex.value, Math.max(ranges.length - 1, 0))
  startRotation()
}

async function recalculatePages() {
  await nextTick()
  buildPageRanges()
}

watch(
  () => props.suggestions,
  async () => {
    measureRefs.value = []
    currentPageIndex.value = 0
    stopRotation()
    await recalculatePages()
  },
  { immediate: true },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    currentPageIndex.value = 0
    void recalculatePages()
  })

  if (viewportRef.value) {
    resizeObserver.observe(viewportRef.value)
  }
})

onBeforeUnmount(() => {
  stopRotation()
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="suggestions-wrapper" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div ref="viewportRef" class="suggestions-viewport" :class="{ 'has-fade': shouldRotate }">
      <Transition name="suggestion-slide" mode="out-in">
        <div :key="currentPageIndex" class="suggestions-row">
          <Suggestion
            v-for="suggestion in currentPageSuggestions"
            :key="suggestion"
            :suggestion="suggestion"
            class="suggestion-chip"
            @click="emit('select', suggestion)"
          />
        </div>
      </Transition>
    </div>

    <div class="suggestions-measurements" aria-hidden="true">
      <Suggestion
        v-for="(suggestion, index) in suggestions"
        :key="`measure-${suggestion}-${index}`"
        :ref="el => setMeasureRef((el as any)?.$el || el, index)"
        :suggestion="suggestion"
        class="suggestion-chip"
        tabindex="-1"
      />
    </div>
  </div>
</template>

<style scoped>
.suggestions-wrapper {
  padding: 0;
  position: relative;
}

.suggestions-viewport {
  position: relative;
  width: 100%;
  height: 24px;
  overflow: hidden;
}

.suggestions-viewport.has-fade::before,
.suggestions-viewport.has-fade::after {
  content: '';
  position: absolute;
  top: 0;
  z-index: 1;
  width: 16px;
  height: 100%;
  pointer-events: none;
}

.suggestions-viewport.has-fade::before {
  left: 0;
  background: linear-gradient(90deg, white 5%, rgba(255, 255, 255, 0));
}

.suggestions-viewport.has-fade::after {
  right: 0;
  background: linear-gradient(270deg, white 5%, rgba(255, 255, 255, 0));
}

.suggestions-row {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 24px;
  overflow: hidden;
}

.suggestions-measurements {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
  height: 0;
  overflow: hidden;
}

:deep(.suggestion-chip) {
  max-width: 100%;
  height: 24px;
  padding: 0 9px;
  border-color: rgba(226, 232, 240, 0.72);
  background: rgba(248, 250, 252, 0.55);
  color: rgba(100, 116, 139, 0.92);
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
  box-shadow: none;
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.suggestion-chip:hover) {
  background: rgba(241, 245, 249, 0.78);
  border-color: rgba(203, 213, 225, 0.78);
}

.suggestion-slide-enter-active,
.suggestion-slide-leave-active {
  transition: transform 0.24s ease, opacity 0.24s ease;
}

.suggestion-slide-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.suggestion-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
