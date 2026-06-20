<template>
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="表情名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入表情名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="添加时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="100" />
      <el-table-column label="表情图" align="center" prop="url" width="80">
        <template #default="scope">
          <el-image
            v-if="scope.row.url"
            :src="scope.row.url"
            :preview-src-list="[scope.row.url]"
            preview-teleported
            class="w-40px h-40px rounded"
            fit="contain"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="表情名"
        align="center"
        prop="name"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column label="所属用户" align="center" min-width="160">
        <template #default="scope">
          <span>{{ scope.row.userNickname || '—' }}</span>
          <span class="ml-1 text-12px text-[var(--el-text-color-placeholder)]">
            ({{ scope.row.userId }})
          </span>
        </template>
      </el-table-column>
      <el-table-column label="尺寸" align="center" width="100">
        <template #default="scope">
          <span v-if="scope.row.width || scope.row.height">
            {{ scope.row.width || '?' }} × {{ scope.row.height || '?' }}
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column
        label="添加时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['im:manager:face-user-item:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as ManagerFaceUserItemApi from '@/api/im/manager/face/userItem'

defineOptions({ name: 'ImManagerFaceUserItem' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref<ManagerFaceUserItemApi.ImManagerFaceUserItemVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  name: undefined as string | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref()

/** 查询用户表情分页 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerFaceUserItemApi.getManagerFaceUserItemPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 删除用户表情（运营审计场景） */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
  } catch {
    return
  }
  await ManagerFaceUserItemApi.deleteManagerFaceUserItem(id)
  message.success(t('common.delSuccess'))
  await getList()
}

onMounted(() => {
  getList()
})
</script>
