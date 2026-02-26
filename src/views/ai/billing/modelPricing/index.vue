<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="90px">
      <el-form-item label="模型" prop="modelId">
        <el-select v-model="queryParams.modelId" placeholder="请选择模型" clearable class="!w-240px">
          <el-option v-for="item in modelList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['ai:model-pricing:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="模型" align="center" prop="modelId" min-width="150">
        <template #default="scope">
          <span>{{ modelList.find((item) => item.id === scope.row.modelId)?.name || scope.row.modelId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="输入单价(元/百万)" align="center" prop="priceInPer1mYuan" min-width="140" />
      <el-table-column label="缓存命中单价(元/百万)" align="center" prop="priceCachedPer1mYuan" min-width="160" />
      <el-table-column label="输出单价(元/百万)" align="center" prop="priceOutPer1mYuan" min-width="140" />
      <el-table-column label="推理单价(元/百万)" align="center" prop="priceReasoningPer1mYuan" min-width="140" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['ai:model-pricing:update']">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['ai:model-pricing:delete']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <ModelPricingForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { ModelPricingApi } from '@/api/ai/billing/modelPricing'
import { ModelApi } from '@/api/ai/model/model'
import ModelPricingForm from './ModelPricingForm.vue'

defineOptions({ name: 'AiModelPricing' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  modelId: undefined,
  status: undefined
})
const queryFormRef = ref()
const modelList = ref<any[]>([])

const getList = async () => {
  loading.value = true
  try {
    const data = await ModelPricingApi.getModelPricingPage(queryParams)
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
    await ModelPricingApi.deleteModelPricing(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

onMounted(async () => {
  await getList()
  const data = await ModelApi.getModelPage({ pageNo: 1, pageSize: 100 })
  modelList.value = data.list
})
</script>
