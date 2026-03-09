<script setup lang="ts">
// import type { InputGroupButtonVariants } from '@/components/ai-bot/ui/input-group'
import type { ChatStatus } from 'ai'
import type { HTMLAttributes } from 'vue'
import { InputGroupButton } from '@/components/ai-bot/ui/input-group'
import { cn } from '@/components/ai-bot/lib/utils'
import { CornerDownLeftIcon, Loader2Icon, SquareIcon, XIcon } from 'lucide-vue-next'
import { computed } from 'vue'

type InputGroupButtonProps = InstanceType<typeof InputGroupButton>['$props']

interface Props extends /* @vue-ignore */ InputGroupButtonProps {
  class?: HTMLAttributes['class']
  status?: ChatStatus
  variant?: InputGroupButtonProps['variant']
  size?: InputGroupButtonProps['size']
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'icon-sm',
})

// 根据状态动态计算 variant
// 可发送时: 橙红色 (#c96442)
// 不可发送时: 灰色
const buttonVariant = computed(() => {
  // 不可发送: disabled 或 忙碌中 (streaming/submitted)
  if (props.disabled || props.status === 'streaming' || props.status === 'submitted') {
    return 'default'
  }
  return 'submit'
})

const icon = computed(() => {
  if (props.status === 'submitted') {
    return Loader2Icon
  }
  else if (props.status === 'streaming') {
    return SquareIcon
  }
  else if (props.status === 'error') {
    return XIcon
  }
  return CornerDownLeftIcon
})

const iconClass = computed(() => {
  if (props.status === 'submitted') {
    return 'size-4 animate-spin'
  }
  return 'size-4'
})

// 动态计算 disabled 状态
// 只有输入为空时才禁用，忙碌中不禁用（可以点击停止流式输出）
const isDisabled = computed(() => {
  return props.disabled
})

const { status, size, variant, disabled, class: _, ...restProps } = props
</script>

<template>
  <InputGroupButton
    aria-label="Submit"
    :class="cn(props.class)"
    :size="size"
    :variant="buttonVariant"
    :disabled="isDisabled"
    type="submit"
    v-bind="restProps"
  >
    <slot>
      <component :is="icon" :class="iconClass" />
    </slot>
  </InputGroupButton>
</template>
