<!-- AI PPT：查看大纲弹窗（素材 + 分镜），只读 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <div v-loading="loading" class="max-h-[65vh] min-h-200px overflow-y-auto pr-4px">
      <template v-if="ppt">
        <!-- 素材 -->
        <div class="mb-8px flex items-center justify-between">
          <span class="font-bold">素材</span>
          <span class="text-12px text-[var(--el-text-color-secondary)]">
            来源：{{ ppt.source === AiPptSourceEnum.UPLOAD ? '上传材料' : '粘贴大纲' }} ·
            {{ ppt.mode === AiPptModeEnum.SLIDES ? '演示用幻灯片' : '详细演示文稿' }} ·
            {{ formatPptLanguage(ppt.language) }} · {{ ppt.pageCount }} 页
          </span>
        </div>
        <div
          class="max-h-240px overflow-y-auto whitespace-pre-wrap break-all rounded-6px bg-[var(--el-fill-color-light)] p-10px text-13px leading-20px"
        >
          {{ ppt.content || '（材料尚未读取）' }}
        </div>
        <div
          v-if="ppt.source === AiPptSourceEnum.UPLOAD"
          class="mt-4px text-12px text-[var(--el-text-color-secondary)]"
        >
          上传材料时为读取出的文本，超过 25000 字的部分已截断
        </div>

        <!-- 分镜 -->
        <div class="mb-8px mt-16px font-bold">分镜（共 {{ slides.length }} 页）</div>
        <el-empty v-if="slides.length === 0" description="还没有分镜" :image-size="60" />
        <div
          v-for="slide in slides"
          :key="slide.index"
          class="mb-8px flex gap-10px border border-[var(--el-border-color-lighter)] rounded-6px border-solid p-10px"
        >
          <span
            class="h-24px w-24px flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--el-color-primary-light-9)] text-12px text-[var(--el-color-primary)]"
          >
            {{ slide.index }}
          </span>
          <div class="min-w-0 flex-1 text-13px leading-20px">
            <div class="font-medium">
              <span v-if="slide.theme" class="text-[var(--el-text-color-secondary)]">
                {{ slide.theme }} ·
              </span>
              {{ slide.title || '-' }}
            </div>
            <ul v-if="slide.points?.length" class="m-0 mt-4px pl-18px">
              <li v-for="(point, index) in slide.points" :key="index">{{ point }}</li>
            </ul>
          </div>
        </div>
        <div class="mt-8px text-12px text-[var(--el-text-color-secondary)]">
          说明：标题和要点只是分镜记录；幻灯片上真正显示的文字画在整页图里。
        </div>
      </template>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { PptApi, PptSlideVO, PptVO } from '@/api/ai/ppt'
import { AiPptModeEnum, AiPptSourceEnum } from '@/views/ai/utils/constants'
import { formatPptLanguage } from '@/views/ai/utils/format'

/** AI PPT：查看大纲弹窗 */
defineOptions({ name: 'AiPptOutlineDialog' })

const props = withDefaults(
  defineProps<{
    readonly?: boolean // 管理端：使用管理端的详情接口
  }>(),
  { readonly: false }
)

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 弹窗的加载中
const ppt = ref<PptVO>() // PPT 详情
const slides = computed<PptSlideVO[]>(() => ppt.value?.slides || []) // 分镜列表
const dialogTitle = computed(() => (ppt.value ? '查看大纲 · ' + ppt.value.title : '查看大纲'))
let requestId = 0 // 请求序号：只采用最后一次打开的结果，避免先打开的详情迟到后覆盖

/** 打开弹窗 */
const open = async (id: number) => {
  const currentRequestId = ++requestId
  ppt.value = undefined
  dialogVisible.value = true
  loading.value = true
  try {
    const data = props.readonly ? await PptApi.getPpt(id) : await PptApi.getPptMy(id)
    if (currentRequestId === requestId) {
      ppt.value = data
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
