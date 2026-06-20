<template>
  <!--
    表情面板（多 tab）：emoji / 个人表情 / N 个系统表情包
    - 对齐微信 PC：底部 tab 栏切换面板内容；emoji 保持 Unicode（仍由 TEXT 通道发送）
    - 个人表情 / 系统表情走 FACE 内容类型，通过 select-face 事件由调用方走 sendRaw 发送
    - mode='emoji' 时只显示 emoji tab + 隐藏底部 tab 栏，给留言 / 评论这类只发文本的场景用
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
      <el-scrollbar v-show="activeTab === FACE_TAB.EMOJI" height="300px">
        <div class="grid grid-cols-10 gap-0.5 p-2">
          <button
            v-for="emoji in IM_EMOJI_LIST"
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
      <el-scrollbar v-if="isFullMode" v-show="activeTab === FACE_TAB.MINE" height="300px">
        <div class="grid grid-cols-5 gap-2 p-3">
          <!-- 上传入口固定放第一格；dashed border 与表情格子区分视觉语义，对齐 el-upload 观感 -->
          <button
            class="aspect-square flex items-center justify-center rounded-md cursor-pointer transition-colors border border-dashed border-[var(--el-border-color)] bg-transparent text-[var(--el-text-color-placeholder)] hover:border-[var(--el-color-primary)] hover:text-[var(--el-color-primary)] disabled:cursor-not-allowed disabled:text-[var(--el-text-color-disabled)]"
            type="button"
            :disabled="uploading"
            :title="uploading ? '上传中…' : '上传图片到个人表情'"
            @click="onUploadClick"
          >
            <Icon
              :icon="uploading ? 'eos-icons:bubble-loading' : 'ant-design:plus-outlined'"
              :size="22"
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
      <template v-if="isFullMode">
        <el-scrollbar
          v-for="pack in faceStore.facePacks"
          v-show="activeTab === packTabKey(pack.id)"
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
      </template>
    </div>

    <!-- 底部 tab 栏：[ emoji / 个人 / 系统包 1..N ]；mode='emoji' 时隐藏 -->
    <div
      v-if="isFullMode"
      class="flex flex-shrink-0 items-center gap-1 px-2 py-1.5 border-t border-t-solid border-[var(--el-border-color-lighter)]"
    >
      <el-tooltip content="Emoji 表情" placement="top" :show-after="300">
        <button
          class="inline-flex items-center justify-center w-[30px] h-[30px] border-none rounded bg-transparent cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
          :class="
            activeTab === FACE_TAB.EMOJI
              ? 'bg-[var(--el-fill-color)] text-[var(--el-color-primary)]'
              : 'text-[var(--el-text-color-regular)]'
          "
          type="button"
          @click="activeTab = FACE_TAB.EMOJI"
        >
          <Icon icon="ant-design:smile-outlined" :size="18" />
        </button>
      </el-tooltip>
      <el-tooltip content="个人表情" placement="top" :show-after="300">
        <button
          class="inline-flex items-center justify-center w-[30px] h-[30px] border-none rounded bg-transparent cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
          :class="
            activeTab === FACE_TAB.MINE
              ? 'bg-[var(--el-fill-color)] text-[var(--el-color-primary)]'
              : 'text-[var(--el-text-color-regular)]'
          "
          type="button"
          @click="activeTab = FACE_TAB.MINE"
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
          class="inline-flex items-center justify-center w-[30px] h-[30px] border-none rounded bg-transparent cursor-pointer transition-colors hover:bg-[var(--el-fill-color)]"
          :class="
            activeTab === packTabKey(pack.id)
              ? 'bg-[var(--el-fill-color)] text-[var(--el-color-primary)]'
              : 'text-[var(--el-text-color-regular)]'
          "
          type="button"
          @click="activeTab = packTabKey(pack.id)"
        >
          <img
            v-if="pack.icon"
            :src="pack.icon"
            :alt="pack.name"
            class="w-[18px] h-[18px] object-contain"
            draggable="false"
          />
          <Icon v-else icon="ant-design:appstore-outlined" :size="18" />
        </button>
      </el-tooltip>
    </div>

    <!-- 隐藏的文件选择器（点 + 时触发） -->
    <input
      v-if="isFullMode"
      ref="uploadInputRef"
      type="file"
      accept="image/*"
      hidden
      @change="onUploadPicked"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { ElMessage } from 'element-plus'

import Icon from '@/components/Icon/src/Icon.vue'
import { updateFile } from '@/api/infra/file'
import { useFaceStore } from '@/views/im/home/store/faceStore'
import { IM_EMOJI_LIST } from '@/views/im/utils/emoji'
import { probeImageSize } from '@/views/im/utils/image'
import type { ImFacePackUserItemVO } from '@/api/im/face/pack'
import type { ImFaceUserItemVO } from '@/api/im/face/useritem'

defineOptions({ name: 'ImFacePicker' })

/** 面板模式 */
type FacePickerMode = 'full' | 'emoji'

const props = withDefaults(
  defineProps<{
    visible: boolean
    /** full：emoji + 个人表情 + 系统包（聊天主输入用）；emoji：仅 emoji（留言 / 评论场景） */
    mode?: FacePickerMode
  }>(),
  { mode: 'full' }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  /** 选中 Unicode emoji（如 😀），调用方应插入到输入框走 TEXT 通道 */
  'select-emoji': [emoji: string]
  /** 选中表情贴图，调用方应走 FACE 消息发送 */
  'select-face': [face: { url: string; width: number; height: number; name?: string }]
}>()

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const uploadInputRef = useTemplateRef<HTMLInputElement>('uploadInputRef')

const faceStore = useFaceStore()

/** tab 标识常量；pack:N 类用 packTabKey() 拼出，避免散落字符串字面量 */
const FACE_TAB = {
  EMOJI: 'emoji',
  MINE: 'mine'
} as const
const packTabKey = (packId: number) => `pack:${packId}`

/** 当前激活的 tab */
const activeTab = ref<string>(FACE_TAB.EMOJI)

/** 是否完整模式（含个人 / 系统包 tab） */
const isFullMode = computed(() => props.mode === 'full')

/** 上传中标记，避免连续点击触发并发上传 */
const uploading = ref(false)

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
  if (!confirm('确认删除该表情？')) {
    return
  }
  await faceStore.removeFaceUserItem(item.id)
}

/** 点 + 触发文件选择 */
function onUploadClick() {
  uploadInputRef.value?.click()
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
  let size: { width: number; height: number }
  try {
    size = await probeImageSize(file)
  } catch (err) {
    console.warn('[IM] 解析个人表情失败', err)
    ElMessage.error('图片解析失败')
    uploading.value = false
    return
  }

  try {
    const form = new FormData()
    form.append('file', file)
    const uploadRes = (await updateFile(form)) as { data?: string }
    const url = uploadRes?.data
    if (!url) {
      ElMessage.error('上传失败')
      return
    }
    const payload = { url, width: size.width, height: size.height }
    await faceStore.addFaceUserItem(payload)
  } finally {
    uploading.value = false
  }
}

/** 面板展开时拉数据 + 挂全局 click；mode='emoji' 时不拉系统包 / 个人表情 */
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener('click', handleDocumentClick)
      if (isFullMode.value) {
        // 系统包通常已被 home onMounted 预拉过；ensureXxx 内部 promise 缓存避免重复请求
        void faceStore.ensureFacePackList()
        void faceStore.ensureFaceUserItemList()
      }
    } else {
      document.removeEventListener('click', handleDocumentClick)
    }
  },
  { immediate: true }
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

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
/* 底部小三角：指向触发图标，仿微信 PC 气泡指针；left 偏移对应表情按钮（工具栏 1st icon） */
.im-popover-arrow::after {
  position: absolute;
  top: calc(100% - 1px);
  left: 10px;
  border-color: var(--el-bg-color) transparent transparent transparent;
  border-style: solid;
  border-width: 6px 6px 0;
  content: '';
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 8%));
}
</style>
