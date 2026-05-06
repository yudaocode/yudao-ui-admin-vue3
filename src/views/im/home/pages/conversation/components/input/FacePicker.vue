<template>
  <!--
    表情面板（多 tab）：emoji / 个人表情 / N 个系统表情包
    - 对齐微信 PC：底部 tab 栏切换面板内容；emoji 保持 Unicode（仍由 TEXT 通道发送）
    - 个人表情 / 系统表情走 FACE 消息类型，通过 select-face 事件由 MessageInput 走 sendRaw 发送
    - 定位由调用方决定（通常浮在表情按钮上方）
  -->
  <div
    v-if="visible"
    ref="rootRef"
    class="im-popover-arrow absolute z-100 flex flex-col w-[380px] rounded-md bg-[var(--el-bg-color)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    @click.stop
  >
    <!-- 主内容区：高度固定 + 各 tab 用 v-show 切换，避免每次切 tab 重建 scrollbar 造成滚动位置丢失 -->
    <div class="relative h-[300px] overflow-hidden">
      <!-- emoji 网格 -->
      <el-scrollbar v-show="activeTab === 'emoji'" height="300px">
        <div class="grid grid-cols-10 gap-0.5 p-2">
          <button
            v-for="emoji in EMOJI_LIST"
            :key="emoji"
            class="p-1 text-xl leading-none bg-transparent border-none rounded cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
            type="button"
            @click="handleSelectEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </el-scrollbar>

      <!-- 个人表情：5 列方格，无名字标签；末尾「+」上传 -->
      <el-scrollbar v-show="activeTab === 'mine'" height="300px">
        <div class="grid grid-cols-5 gap-2 p-3">
          <!-- 上传入口固定放第一格，对齐微信 -->
          <button
            class="aspect-square flex items-center justify-center rounded-md border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-lighter)] text-2xl text-[var(--el-text-color-placeholder)] cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
            type="button"
            :disabled="uploading"
            @click="onUploadClick"
          >
            <Icon
              :icon="uploading ? 'eos-icons:bubble-loading' : 'ant-design:plus-outlined'"
              :size="20"
            />
          </button>
          <div
            v-for="item in faceStore.faceUserItems"
            :key="item.id"
            class="im-face-grid-cell group relative aspect-square flex items-center justify-center rounded-md bg-[var(--el-fill-color-lighter)] cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
            :title="item.name || '点击发送 / 右键删除'"
            @click="handleSelectFaceUserItem(item)"
            @contextmenu.prevent="handleDeleteUserItem(item)"
          >
            <img
              :src="item.url"
              :alt="item.name || '表情'"
              class="max-w-full max-h-full object-contain"
              draggable="false"
            />
          </div>
          <div
            v-if="!faceStore.faceUserItems.length"
            class="col-span-5 flex items-center justify-center py-12 text-sm text-[var(--el-text-color-placeholder)]"
          >
            还没有个人表情，点 + 上传 / 在聊天里长按消息添加
          </div>
        </div>
      </el-scrollbar>

      <!-- 系统表情包：5 列方格 + 下方表情名（无 name 时不显示标签，保持高度一致） -->
      <el-scrollbar
        v-for="pack in faceStore.facePacks"
        v-show="activeTab === `pack:${pack.id}`"
        :key="pack.id"
        height="300px"
      >
        <div class="grid grid-cols-5 gap-2 p-3">
          <div
            v-for="item in pack.items"
            :key="item.id"
            class="im-face-grid-cell flex flex-col items-center gap-1 cursor-pointer rounded-md p-1 transition-colors hover:bg-[var(--el-fill-color)]"
            :title="item.name || ''"
            @click="handleSelectPackItem(item)"
          >
            <div
              class="aspect-square w-full flex items-center justify-center bg-[var(--el-fill-color-lighter)] rounded"
            >
              <img
                :src="item.url"
                :alt="item.name || '表情'"
                class="max-w-full max-h-full object-contain"
                draggable="false"
              />
            </div>
            <div
              class="h-4 text-xs text-[var(--el-text-color-secondary)] truncate w-full text-center leading-4"
            >
              {{ item.name || '' }}
            </div>
          </div>
          <div
            v-if="!pack.items.length"
            class="col-span-5 flex items-center justify-center py-12 text-sm text-[var(--el-text-color-placeholder)]"
          >
            该表情包暂无表情
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 底部 tab 栏：[ emoji / 个人 / 系统包 1..N ] -->
    <div
      class="flex flex-shrink-0 items-center gap-1 px-2 py-1.5 border-t border-[var(--el-border-color-lighter)]"
    >
      <el-tooltip content="Emoji 表情" placement="top" :show-after="300">
        <button
          class="im-face-tab"
          :class="{ 'im-face-tab--active': activeTab === 'emoji' }"
          type="button"
          @click="activeTab = 'emoji'"
        >
          <Icon icon="ant-design:smile-outlined" :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip content="个人表情" placement="top" :show-after="300">
        <button
          class="im-face-tab"
          :class="{ 'im-face-tab--active': activeTab === 'mine' }"
          type="button"
          @click="activeTab = 'mine'"
        >
          <Icon icon="ant-design:heart-outlined" :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip
        v-for="pack in faceStore.facePacks"
        :key="pack.id"
        :content="pack.name"
        placement="top"
        :show-after="300"
      >
        <button
          class="im-face-tab"
          :class="{ 'im-face-tab--active': activeTab === `pack:${pack.id}` }"
          type="button"
          @click="activeTab = `pack:${pack.id}`"
        >
          <img
            v-if="pack.iconUrl"
            :src="pack.iconUrl"
            :alt="pack.name"
            class="w-[18px] h-[18px] object-contain"
            draggable="false"
          />
          <Icon v-else icon="ant-design:appstore-outlined" :size="18" />
        </button>
      </el-tooltip>
    </div>

    <!-- 隐藏的文件选择器（点 + 时触发） -->
    <input ref="uploadInputRef" type="file" accept="image/*" hidden @change="onUploadPicked" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { ElMessage } from 'element-plus'

import Icon from '@/components/Icon/src/Icon.vue'
import { updateFile } from '@/api/infra/file'
import { useFaceStore } from '@/views/im/home/store/faceStore'
import type { ImFacePackUserItemVO, ImFaceUserItemVO } from '@/api/im/face'

defineOptions({ name: 'ImFacePicker' })

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  /** 选中 Unicode emoji（如 😀），调用方应插入到输入框走 TEXT 通道 */
  'select-emoji': [emoji: string]
  /** 选中表情贴图，调用方应走 FACE 消息发送 */
  'select-face': [face: { url: string; width: number; height: number; name?: string }]
}>()

// TODO @AI：emoji 和 facepicker 可以做一个融合么？不然代码有点冗余。

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const uploadInputRef = useTemplateRef<HTMLInputElement>('uploadInputRef')

const faceStore = useFaceStore()

/** 当前激活的 tab：emoji / mine / pack:{id} */
const activeTab = ref<string>('emoji')

/** 上传中标记，避免连续点击 + 触发并发上传 */
const uploading = ref(false)

/** 常用 Unicode emoji 列表（所见即所得，不依赖图片资源） */
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

/** 选 emoji 字符：插到输入框；选完不关面板，方便用户连发多个 */
function handleSelectEmoji(emoji: string) {
  emit('select-emoji', emoji)
}

/** 选个人表情：直接发；点完关面板，对齐微信 */
function handleSelectFaceUserItem(item: ImFaceUserItemVO) {
  emit('select-face', { url: item.url, width: item.width, height: item.height, name: item.name })
  emit('update:visible', false)
}

/** 选系统表情包内表情：直接发；点完关面板 */
function handleSelectPackItem(item: ImFacePackUserItemVO) {
  emit('select-face', { url: item.url, width: item.width, height: item.height, name: item.name })
  emit('update:visible', false)
}

/** 长按 / 右键删除个人表情 */
async function handleDeleteUserItem(item: ImFaceUserItemVO) {
  if (!confirm(`确认删除该表情？`)) {
    return
  }
  await faceStore.removeFaceUserItem(item.id)
}

/** 点 + 触发文件选择 */
function onUploadClick() {
  uploadInputRef.value?.click()
}

/** 加载图片元信息（宽高），失败回退 200×200 */
function probeImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: img.naturalWidth || 200, height: img.naturalHeight || 200 })
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({ width: 200, height: 200 })
    }
    img.src = objectUrl
  })
}

/** 文件选完即上传，成功后写入 faceStore 个人表情列表 */
async function onUploadPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    return
  }
  uploading.value = true
  try {
    // probe 本地图片宽高 + 上传到 OSS 并行起跑（probe 通常远快于上传，几乎完全被遮蔽）
    const form = new FormData()
    form.append('file', file)
    const [size, uploadRes] = await Promise.all([
      probeImageSize(file),
      updateFile(form) as Promise<{ data?: string }>
    ])
    const url = uploadRes?.data
    if (!url) {
      ElMessage.error('上传失败')
      return
    }
    await faceStore.addFaceUserItem({ url, width: size.width, height: size.height })
  } catch (err) {
    console.warn('[IM] 上传个人表情失败', err)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

/** 面板首次展开时拉数据；emoji tab 直接渲染本地常量，不需要预拉 */
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      document.addEventListener('click', handleDocumentClick)
      // 系统包 + 个人表情都按需拉，避免没打开过面板的用户白白请求
      await Promise.all([faceStore.ensureFacePacks(), faceStore.ensureFaceUserItems()])
    } else {
      document.removeEventListener('click', handleDocumentClick)
    }
  }
)

/** 点击面板外部关闭 */
function handleDocumentClick(e: MouseEvent) {
  if (!props.visible || !rootRef.value) {
    return
  }
  if (!rootRef.value.contains(e.target as Node)) {
    emit('update:visible', false)
  }
}

onMounted(() => {
  if (props.visible) {
    document.addEventListener('click', handleDocumentClick)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
/* 底部小三角：指向触发图标，仿微信 PC 气泡指针；left 偏移对应表情按钮（工具栏 1st icon） */
.im-popover-arrow::after {
  content: '';
  position: absolute;
  top: calc(100% - 1px);
  left: 10px;
  border-style: solid;
  border-width: 6px 6px 0 6px;
  border-color: var(--el-bg-color) transparent transparent transparent;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.08));
}

/* tab 按钮样式：被选中走主色高亮，鼠标悬停浅底 */
.im-face-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}
.im-face-tab:hover {
  background-color: var(--el-fill-color);
}
.im-face-tab--active {
  background-color: var(--el-fill-color);
  color: var(--el-color-primary);
}
</style>
