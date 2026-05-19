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
        <ChannelSelect v-model="queryParams.channelId" placeholder="全部" clearable class="!w-200px" />
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

  <ChannelMaterialForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as MaterialApi from '@/api/im/manager/channel/material'
import ChannelSelect from '../list/components/ChannelSelect.vue'
import ChannelMaterialForm from './ChannelMaterialForm.vue'

defineOptions({ name: 'ImChannelMaterial' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<MaterialApi.ImManagerChannelMaterialVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  channelId: undefined as number | undefined,
  title: undefined as string | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询素材分页 */
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

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 打开新增 / 编辑弹窗 */
const formRef = ref() // 表单 Ref
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除 */
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

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
