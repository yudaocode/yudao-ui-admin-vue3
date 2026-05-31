<template>
  <!--
    通用右键菜单
    由 useImUiStore.openContextMenu(position, items, onSelect) 触发全局单例展示
    调用方在 @contextmenu.prevent 事件里调 openContextMenu 即可，不需要自己挂组件
  -->
  <teleport to="body">
    <div
      v-if="contextMenu.show"
      class="fixed inset-0 z-9999"
      @click.stop="handleClose"
      @contextmenu.prevent="handleClose"
    >
      <div
        class="fixed min-w-30 py-1 bg-[var(--el-bg-color-overlay)] rounded-md shadow-lg"
        :style="{ left: adjustedPosition.x + 'px', top: adjustedPosition.y + 'px' }"
      >
        <template v-for="(item, index) in contextMenu.items" :key="item.key">
          <!-- divided 项上方插一条分割线（首项跳过，避免空白） -->
          <div
            v-if="item.divided && index > 0"
            class="my-1 mx-2 h-[1px] bg-[var(--el-border-color-lighter)]"
          ></div>
          <div
            class="flex gap-2 items-center px-4 py-2 text-13px text-left cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
            :class="[
              item.disabled
                ? '!text-[var(--el-text-color-disabled)] cursor-not-allowed hover:!bg-transparent'
                : item.danger
                  ? 'text-[#f56c6c]'
                  : 'text-[var(--el-text-color-primary)]'
            ]"
            @click.stop="handleSelect(item)"
          >
            <Icon v-if="item.icon" :icon="item.icon" :size="14" />
            <span>{{ item.name }}</span>
          </div>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/src/Icon.vue'

import { useImUiStore } from '../store/uiStore'

defineOptions({ name: 'ImContextMenu' })

const uiStore = useImUiStore()
const contextMenu = computed(() => uiStore.contextMenu)

/**
 * 计算菜单实际渲染坐标：靠近视口右 / 下边缘时回弹，避免菜单被裁剪
 *
 * itemHeight / menuWidth 是和模板里 px-4 py-2 + text-13px / min-w-30 配套的实际尺寸；
 * dividerHeight = 9px（my-1 上下各 4 + 1px border），仅非首项的 divided 计入；
 * menuHeight 额外加 8 是外层 py-1 的上下 padding 之和（4px × 2）
 */
const adjustedPosition = computed(() => {
  const items = contextMenu.value.items
  const itemHeight = 34
  const dividerCount = items.filter((it, i) => it.divided && i > 0).length
  const menuHeight = items.length * itemHeight + dividerCount * 9 + 8
  const menuWidth = 120
  let x = contextMenu.value.position.x
  let y = contextMenu.value.position.y
  // SSR 兜底：window 不可用时直接返回原始坐标
  if (typeof window !== 'undefined') {
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight
    }
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth
    }
  }
  // 视口很小 / 菜单项很多时上面减法会算出负值，把菜单顶 / 左边推到 0 兜底
  return { x: Math.max(0, x), y: Math.max(0, y) }
})

type MenuItem = (typeof contextMenu.value.items)[number]

/** 选中菜单项：disabled 项忽略；正常项调 onSelect 回调后关闭菜单 */
function handleSelect(item: MenuItem) {
  if (item.disabled) {
    return
  }
  uiStore.contextMenu.onSelect?.(item)
  uiStore.closeContextMenu()
}

/** 关闭菜单：点遮罩 / 在遮罩上再次右键都会触发 */
function handleClose() {
  uiStore.closeContextMenu()
}
</script>
