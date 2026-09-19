<template>
  <div>
    <!-- 回收站详情 -->
    <KnowledgeRecycleDetail
      v-if="detail"
      :detail="detail"
      @back="detail = undefined"
      @permanent-delete="handlePermanentDelete"
      @restore="handleRestore"
    />

    <!-- 回收站列表 -->
    <template v-else>
      <div class="flex items-center justify-between">
        <span class="text-20px font-600">最近删除</span>
        <span class="text-12px text-[var(--el-text-color-secondary)]">
          内容最多保留 30 天，之后将被永久删除
        </span>
      </div>
      <!-- 类型筛选 -->
      <el-tabs v-model="activeType" class="mt-12px">
        <el-tab-pane
          :label="`文档 (${countByType(PmsKnowledgeObjectType.DOCUMENT)})`"
          :name="PmsKnowledgeObjectType.DOCUMENT"
        />
        <el-tab-pane
          :label="`文件夹 (${countByType(PmsKnowledgeObjectType.FOLDER)})`"
          :name="PmsKnowledgeObjectType.FOLDER"
        />
        <el-tab-pane
          :label="`文件 (${countByType(PmsKnowledgeObjectType.FILE)})`"
          :name="PmsKnowledgeObjectType.FILE"
        />
      </el-tabs>
      <!-- 列表 -->
      <el-table v-loading="loading" :data="filteredList" :show-overflow-tooltip="true">
        <el-table-column label="名称" min-width="240">
          <template #default="scope">
            <el-button link type="primary" @click="handleDetail(scope.row)">
              {{ scope.row.name }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column align="center" label="类型" width="100">
          <template #default="scope">
            <DictTag :type="DICT_TYPE.PMS_KNOWLEDGE_OBJECT_TYPE" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column label="删除人" prop="deleteUserName" width="130" />
        <el-table-column
          v-if="activeType === PmsKnowledgeObjectType.FILE"
          label="大小"
          prop="fileSize"
          width="120"
        >
          <template #default="scope">
            {{ scope.row.fileSize == null ? '-' : formatKnowledgeFileSize(scope.row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column
          :formatter="dateFormatter"
          label="删除时间"
          prop="deleteTime"
          width="180"
        />
        <el-table-column align="center" fixed="right" label="操作" width="150">
          <template #default="scope">
            <el-button link type="primary" @click="handleRestore(scope.row)">恢复</el-button>
            <el-button link type="danger" @click="handlePermanentDelete(scope.row)">
              彻底删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<script lang="ts" setup>
import * as KnowledgeRecycleApi from '@/api/pms/kb/recycle'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { formatKnowledgeFileSize } from '@/views/pms/kb/utils/format'
import { PmsKnowledgeObjectType } from '@/views/pms/kb/utils/constants'
import KnowledgeRecycleDetail from './KnowledgeRecycleDetail.vue'

defineOptions({ name: 'PmsKnowledgeRecyclePanel' })

const message = useMessage() // 消息弹窗
const props = defineProps<{
  libraryId: number
}>() // 组件参数
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const loading = ref(false) // 列表加载中
const list = ref<KnowledgeRecycleApi.PmsKnowledgeRecycleVO[]>([]) // 回收站记录列表
const activeType = ref<number>(PmsKnowledgeObjectType.DOCUMENT) // 当前对象类型
const filteredList = computed(() => list.value.filter((record) => record.type === activeType.value)) // 当前类型的回收站记录
const detail = ref<KnowledgeRecycleApi.PmsKnowledgeRecycleDetailVO>()
function countByType(type: number) {
  return list.value.filter((record) => record.type === type).length
}

/** 查询回收站记录列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await KnowledgeRecycleApi.getKnowledgeContentRecycleList(props.libraryId)
  } finally {
    loading.value = false
  }
}

/** 恢复回收站记录 */
async function handleRestore(record: KnowledgeRecycleApi.PmsKnowledgeRecycleVO) {
  try {
    // 恢复的二次确认
    await message.confirm(`确认恢复“${record.name}”吗？`)
    // 发起恢复
    await KnowledgeRecycleApi.restoreKnowledgeRecycle(record.id)
    message.success('恢复成功')
    // 刷新列表和知识库内容
    await getList()
    emit('success')
  } catch {}
}

/** 查看本次删除对象的级联内容 */
async function handleDetail(record: KnowledgeRecycleApi.PmsKnowledgeRecycleVO) {
  try {
    detail.value = await KnowledgeRecycleApi.getKnowledgeContentRecycleDetail(record.id)
  } catch {}
}

/** 彻底删除回收站记录 */
async function handlePermanentDelete(record: KnowledgeRecycleApi.PmsKnowledgeRecycleVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`彻底删除后不可恢复，确认删除“${record.name}”吗？`)
    // 发起删除
    await KnowledgeRecycleApi.permanentDeleteKnowledgeRecycle(record.id)
    message.success('彻底删除成功')
    // 刷新列表和知识库内容
    await getList()
    emit('success')
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
:deep(.el-tabs__item),
:deep(.el-table) {
  font-size: 14px;
}
</style>
