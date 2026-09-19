<template>
  <doc-alert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />

  <!-- 回收站 -->
  <ContentWrap>
    <el-alert
      class="mb-12px"
      :closable="false"
      show-icon
      title="恢复时会保留此前单独删除的子项；彻底删除后无法恢复。"
      type="warning"
    />
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="名称" min-width="240" prop="name" />
      <el-table-column align="center" label="类型" width="100">
        <template #default="scope">
          <DictTag :type="DICT_TYPE.PMS_KNOWLEDGE_OBJECT_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="删除人" prop="deleteUserName" width="130" />
      <el-table-column :formatter="dateFormatter" label="删除时间" prop="deleteTime" width="180" />
      <el-table-column align="center" fixed="right" label="操作" width="150">
        <template #default="scope">
          <el-button link type="primary" @click="handleRestore(scope.row)">恢复</el-button>
          <el-button link type="danger" @click="handlePermanentDelete(scope.row)">
            彻底删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as KnowledgeRecycleApi from '@/api/pms/kb/recycle'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'

defineOptions({ name: 'PmsKnowledgeRecycle' })

const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表加载中
const list = ref<KnowledgeRecycleApi.PmsKnowledgeRecycleVO[]>([]) // 回收站记录列表

/** 查询回收站记录列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await KnowledgeRecycleApi.getKnowledgeLibraryRecycleList()
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
    // 刷新列表
    await getList()
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
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
