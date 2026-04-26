<template>
  <!--
    表情选择器
    当前实现简化为：
    - 直接用 Unicode emoji，插入到输入框即所见即所得
    - 调用方通过 v-model:visible 控制显隐，通过 @select 接收选中的 emoji 字符
    - 定位由调用方决定（通常是「浮在表情按钮上方」）
  -->
  <div
    v-if="visible"
    ref="rootRef"
    class="absolute z-100 w-80 p-2 rounded-md bg-[var(--el-bg-color)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    @click.stop
  >
    <el-scrollbar max-height="240px">
      <div class="grid grid-cols-10 gap-0.5">
        <button
          v-for="emoji in EMOJI_LIST"
          :key="emoji"
          class="p-1 text-xl leading-none bg-transparent border-none rounded cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
          type="button"
          @click="handleSelect(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

defineOptions({ name: 'ImEmojiPicker' })

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [emoji: string]
}>()

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')

/** 常用 emoji 列表（Unicode 表情，所见即所得；不依赖图片资源） */
const EMOJI_LIST = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
  '😋', '😎', '😍', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩',
  '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
  '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤',
  '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖',
  '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯',
  '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠',
  '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🥳',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '👇', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '🙏', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💕', '💖',
  '🎉', '🎊', '🎁', '🎂', '🍰', '🌹', '🌷', '🌸', '🎵', '🎶',
  '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '⚠️', '❓'
]

function handleSelect(emoji: string) {
  emit('select', emoji)
  emit('update:visible', false)
}

/** 点击面板外部关闭：组件根节点已经 @click.stop，所以面板内点击不会触发 */
function handleDocumentClick(e: MouseEvent) {
  if (!props.visible || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(e.target as Node)) {
    emit('update:visible', false)
  }
}

/** 仅在面板可见时监听，避免长期占用全局事件 */
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener('click', handleDocumentClick)
    } else {
      document.removeEventListener('click', handleDocumentClick)
    }
  }
)

onMounted(() => {
  if (props.visible) {
    document.addEventListener('click', handleDocumentClick)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

