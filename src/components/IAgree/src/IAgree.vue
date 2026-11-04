<script lang="ts" setup>
import { CheckboxValueType, ElCheckbox } from 'element-plus'
import { computed, PropType } from 'vue'
import { LinkItem } from './types'

defineOptions({ name: 'IAgree' })

interface TextSegment {
  text: string
  // 命中的链接文字，普通文字为 undefined
  key?: string
}

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  link: {
    type: Array as PropType<LinkItem[]>,
    default: undefined
  },
  // String 写在 Boolean 前：避免 Form 等传入的 '' 被 Vue 按布尔属性转换为 true
  modelValue: {
    type: [String, Number, Boolean] as PropType<boolean | string | number>,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// 只有 true 视为已勾选
const checked = computed(() => props.modelValue === true)

const handleChange = (val: CheckboxValueType) => {
  emit('update:modelValue', val === true)
}

// 按链接文字做字面量分段（不使用正则，协议文字含 ( [ 等字符也能正常匹配）；
// 同一位置命中多个链接文字时取最长的
const segments = computed<TextSegment[]>(() => {
  const text = props.text || ''
  const keys = Array.from(new Set((props.link || []).map((item) => item.text).filter(Boolean)))
  const result: TextSegment[] = []
  let index = 0
  while (index < text.length) {
    let matchIndex = -1
    let matchKey = ''
    for (const key of keys) {
      const i = text.indexOf(key, index)
      if (
        i !== -1 &&
        (matchIndex === -1 || i < matchIndex || (i === matchIndex && key.length > matchKey.length))
      ) {
        matchIndex = i
        matchKey = key
      }
    }
    if (matchIndex === -1) {
      result.push({ text: text.slice(index) })
      break
    }
    if (matchIndex > index) {
      result.push({ text: text.slice(index, matchIndex) })
    }
    result.push({ text: matchKey, key: matchKey })
    index = matchIndex + matchKey.length
  }
  return result
})

const keyClick = (key: string) => {
  const linkItem = props.link?.find((item) => item.text === key)
  if (linkItem?.url) {
    window.open(linkItem.url, '_blank', 'noopener')
    return
  }
  if (linkItem?.onClick) {
    linkItem.onClick()
  }
}
</script>

<template>
  <div class="flex items-center">
    <ElCheckbox :model-value="checked" class="mr-0px!" @update:model-value="handleChange" />
    <span class="ml-10px">
      <template v-for="(item, index) in segments" :key="index">
        <span
          v-if="item.key"
          class="cursor-pointer"
          style="color: var(--el-color-primary)"
          @click="keyClick(item.key)"
          >{{ item.text }}</span
        >
        <template v-else>{{ item.text }}</template>
      </template>
    </span>
  </div>
</template>
