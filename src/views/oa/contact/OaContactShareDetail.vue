<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-table :data="detailData?.shares || []" v-loading="loading" border>
      <el-table-column label="共享接收人" min-width="160">
        <template #default="shareScope">
          <div class="flex items-center gap-8px">
            <el-avatar :src="shareScope.row.userAvatar" :size="26" />
            <span>{{ shareScope.row.userName || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="接收人分类" prop="categoryName" min-width="140">
        <template #default="shareScope">{{ shareScope.row.categoryName || '未分类' }}</template>
      </el-table-column>
      <el-table-column label="处理状态" width="100">
        <template #default="shareScope">
          <el-tag :type="shareScope.row.handleStatus ? 'success' : 'warning'">
            {{ shareScope.row.handleStatus ? '已处理' : '待处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="共享人" prop="creatorName" width="120" />
      <el-table-column :formatter="dateFormatter" label="共享时间" prop="createTime" width="180" />
    </el-table>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as ContactApi from '@/api/oa/contact'
import { dateFormatter } from '@/utils/formatTime'

defineOptions({ name: 'OaContactShareDetail' })

const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('共享接收人') // 弹窗标题
const loading = ref(false) // 共享明细加载中
const detailData = ref<ContactApi.OaContactVO>() // 联系人共享明细

/** 打开共享接收人明细 */
async function open(id: number, name: string) {
  dialogVisible.value = true
  dialogTitle.value = name + ' · 共享接收人'
  detailData.value = undefined
  loading.value = true
  try {
    detailData.value = await ContactApi.getContact(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
