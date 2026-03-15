<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AiBotTheme } from '@/components/ai-bot/lib/theme'
import { cn } from '@/components/ai-bot/lib/utils'
import { computed, useSlots } from 'vue'
import { MarkdownRender } from 'markstream-vue'
import 'markstream-vue/index.css'

interface Props {
  content?: string
  class?: HTMLAttributes['class']
  theme?: AiBotTheme
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light'
})

const markdownThemes = ['vitesse-dark', 'vitesse-light']

const slots = useSlots()
const slotContent = computed<string | undefined>(() => {
  const nodes = slots.default?.()
  if (!Array.isArray(nodes)) {
    return undefined
  }
  let text = ''
  for (const node of nodes) {
    if (typeof node.children === 'string')
      text += node.children
  }
  return text || undefined
})

const md = computed(() => (slotContent.value ?? props.content ?? '') as string)
</script>

<template>
  <MarkdownRender
    :content="md"
    :is-dark="props.theme === 'dark'"
    code-block-dark-theme="vitesse-dark"
    code-block-light-theme="vitesse-light"
    :themes="markdownThemes"
    :class="
      cn(
        'markdown-body size-full [&>*:first-child]:mt-0! [&>*:last-child]:mb-0!',
        props.class,
      )
    "
    v-bind="$attrs"
  />
</template>
