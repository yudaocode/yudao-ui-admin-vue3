<!-- emoji 表情选择组件 -->
<template>
  <el-popover :width="500" placement="top" trigger="click">
    <template #reference>
      <Icon :size="30" class="ml-10px cursor-pointer" icon="twemoji:grinning-face" />
    </template>
    <ElScrollbar height="300px">
      <ul class="ml-2 flex flex-wrap px-2">
        <li
          v-for="(item, index) in emojiList"
          :key="index"
          :style="{
            borderColor: 'var(--el-color-primary)',
            color: 'var(--el-color-primary)'
          }"
          :title="item.name"
          class="icon-item mr-2 mt-1 w-1/10 flex cursor-pointer items-center justify-center border border-solid p-2"
          @click="handleSelect(item)"
        >
          <img :src="item.url" class="w-24px h-24px" />
        </li>
      </ul>
    </ElScrollbar>
  </el-popover>
</template>

<script lang="ts" setup>
defineOptions({ name: 'EmojiSelectPopover' })
import { Emoji, useEmoji } from './emoji'

const { getEmojiList } = useEmoji()
const emojiList = computed(() => getEmojiList())

/** 选择 emoji 表情 */
const emits = defineEmits<{
  (e: 'select-emoji', v: Emoji)
}>()
const handleSelect = (item: Emoji) => {
  // 整个 emoji 数据传递出去，方便以后输入框直接显示表情
  emits('select-emoji', item)
}
</script>
