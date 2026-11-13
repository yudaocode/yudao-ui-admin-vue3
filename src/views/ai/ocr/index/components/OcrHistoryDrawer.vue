<!-- AI 文字识别：识别记录抽屉 -->
<template>
  <el-drawer v-model="visible" title="识别记录" size="460px" @open="getList">
    <div class="h-full flex flex-col">
      <div v-loading="loading" class="min-h-0 flex-1 overflow-y-auto pr-4px">
        <el-empty v-if="list.length === 0" description="暂无识别记录" />
        <div v-else class="flex flex-col gap-10px">
          <div
            v-for="item in list"
            :key="item.id"
            class="flex gap-12px border border-[var(--el-border-color-lighter)] rounded-8px border-solid p-10px"
            :class="
              item.id === currentId
                ? '!border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
                : 'hover:shadow-[var(--el-box-shadow-light)]'
            "
          >
            <el-image
              :src="item.imageUrl"
              :preview-src-list="[item.imageUrl]"
              fit="cover"
              preview-teleported
              class="h-64px w-64px flex-shrink-0 rounded-6px bg-[var(--el-fill-color-light)]"
            />
            <div class="min-w-0 flex flex-1 flex-col gap-4px">
              <div class="flex items-center justify-between gap-8px">
                <span class="truncate text-14px font-medium">{{ item.fileName }}</span>
                <el-tag
                  :type="item.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'danger'"
                  size="small"
                  class="flex-shrink-0"
                >
                  {{ item.status === AiOcrStatusEnum.SUCCESS ? '识别成功' : '识别失败' }}
                </el-tag>
              </div>
              <div class="truncate text-12px text-[var(--el-text-color-secondary)]">
                {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }} · {{ item.modelName }}
                <template v-if="item.editedText !== null && item.editedText !== undefined">
                  · 已修订
                </template>
              </div>
              <div
                v-if="item.status === AiOcrStatusEnum.FAIL"
                class="line-clamp-2 break-all text-12px text-[var(--el-color-danger)]"
              >
                {{ item.errorMessage }}
              </div>
              <div
                v-else
                class="line-clamp-2 whitespace-pre-wrap break-all text-12px text-[var(--el-text-color-regular)]"
              >
                {{ getText(item) || '（无文字）' }}
              </div>
              <div class="flex justify-end gap-8px">
                <el-button link type="primary" size="small" @click="emit('open', item)">
                  打开
                </el-button>
                <el-button link type="danger" size="small" @click="handleDelete(item)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList()"
      />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { OcrApi, OcrVO } from '@/api/ai/ocr'
import { AiOcrStatusEnum } from '@/views/ai/utils/constants'

/** AI 文字识别：识别记录抽屉 */
defineOptions({ name: 'AiOcrHistoryDrawer' })

defineProps<{
  currentId?: number // 工作台当前打开的记录编号
}>()

const emit = defineEmits<{
  (e: 'open', item: OcrVO): void // 打开记录：恢复到工作台
  (e: 'deleted', id: number): void // 删除记录
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const visible = ref(false) // 是否展示
const loading = ref(false) // 列表的加载中
const list = ref<OcrVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 })

/** 当前文本：已修订（包括清空为空字符串）用修订文本，否则用原文 */
const getText = (item: OcrVO) => item.editedText ?? item.originalText ?? ''

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await OcrApi.getOcrMyPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除：图片文件不随记录删除 */
const handleDelete = async (item: OcrVO) => {
  try {
    await message.delConfirm('确定删除该识别记录吗？')
  } catch {
    return
  }
  await OcrApi.deleteOcrMy(item.id)
  message.success(t('common.delSuccess'))
  emit('deleted', item.id)
  await getList()
}

/** 打开抽屉 */
const open = () => {
  visible.value = true
}

/** 关闭抽屉 */
const close = () => {
  visible.value = false
}

defineExpose({ open, close, getList })
</script>
