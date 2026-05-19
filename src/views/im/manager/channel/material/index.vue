<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="频道" prop="channelId">
        <el-select v-model="queryParams.channelId" placeholder="全部" clearable class="!w-200px">
          <el-option v-for="c in channelList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="标题关键字"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['im:manager:channel-material:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增素材
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="封面" align="center" prop="coverUrl" width="80">
        <template #default="scope">
          <el-image
            v-if="scope.row.coverUrl"
            :src="scope.row.coverUrl"
            class="w-40px h-40px rounded"
            fit="cover"
          />
        </template>
      </el-table-column>
      <el-table-column label="频道" align="center" prop="channelName" width="120" />
      <el-table-column
        label="标题"
        align="left"
        prop="title"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        label="摘要"
        align="left"
        prop="summary"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="跳转" align="center" prop="url" width="80">
        <template #default="scope">
          <el-link v-if="scope.row.url" type="primary" :href="scope.row.url" target="_blank"
            >外链</el-link
          >
          <el-tag v-else type="info" size="small">站内</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="170"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['im:manager:channel-material:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['im:manager:channel-material:delete']"
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

  <ChannelMaterialForm ref="formRef" :channel-list="channelList" @success="getList" />
</template>

<script lang="ts" setup>
// TOOD @AI：注释风格，对齐 system user index
import { dateFormatter } from '@/utils/formatTime'
import * as MaterialApi from '@/api/im/manager/channel/material'
import * as ChannelApi from '@/api/im/manager/channel'
import ChannelMaterialForm from './ChannelMaterialForm.vue'

defineOptions({ name: 'ImChannelMaterial' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref<MaterialApi.ImManagerChannelMaterialVO[]>([])
const channelList = ref<ChannelApi.ImManagerChannelVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  channelId: undefined as number | undefined,
  title: undefined as string | undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await MaterialApi.getManagerChannelMaterialPage(queryParams)
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

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
  } catch {
    return
  }
  await MaterialApi.deleteManagerChannelMaterial(id)
  message.success(t('common.delSuccess'))
  await getList()
}

onMounted(async () => {
  // TOOD @AI：注释风格，ChannelApi 列表，让 channel/components 抽个组件，复用一下；
  channelList.value = await ChannelApi.getEnabledChannelList()
  getList()
})
</script>
