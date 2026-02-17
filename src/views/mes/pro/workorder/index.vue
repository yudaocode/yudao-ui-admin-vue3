<!-- MES 生产工单列表 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="工单编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工单编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="工单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="工单类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择工单类型" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORKORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源类型" prop="orderSourceType">
        <el-select
          v-model="queryParams.orderSourceType"
          placeholder="请选择来源类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORKORDER_SOURCE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="工单状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择工单状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORKORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="需求日期" prop="requestDate">
        <el-date-picker
          v-model="queryParams.requestDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:pro-workorder:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-workorder:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="工单编码" align="center" prop="code" width="140" />
      <el-table-column label="工单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="工单类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORKORDER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="来源类型" align="center" prop="orderSourceType" width="100">
        <template #default="scope">
          <dict-tag
            :type="DICT_TYPE.MES_PRO_WORKORDER_SOURCE_TYPE"
            :value="scope.row.orderSourceType"
          />
        </template>
      </el-table-column>
      <el-table-column label="产品名称" align="center" prop="productName" min-width="120" />
      <el-table-column label="产品编码" align="center" prop="productCode" width="120" />
      <el-table-column label="规格型号" align="center" prop="productSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="生产数量" align="center" prop="quantity" width="100" />
      <el-table-column label="已生产" align="center" prop="quantityProduced" width="80" />
      <el-table-column label="客户" align="center" prop="clientName" width="120" />
      <el-table-column label="需求日期" align="center" prop="requestDate" :formatter="dateFormatter" width="180" />
      <el-table-column label="工单状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORKORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <!-- 草稿状态：编辑、删除 -->
          <template v-if="scope.row.status === MesProWorkorderStatusEnum.PREPARE">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['mes:pro-workorder:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:pro-workorder:delete']"
            >
              删除
            </el-button>
          </template>
          <!-- 已确认状态：完成、取消 -->
          <template v-if="scope.row.status === MesProWorkorderStatusEnum.CONFIRMED">
            <el-button
              link
              type="success"
              @click="handleFinish(scope.row.id)"
              v-hasPermi="['mes:pro-workorder:update']"
            >
              完成
            </el-button>
            <el-button
              link
              type="warning"
              @click="handleCancel(scope.row.id)"
              v-hasPermi="['mes:pro-workorder:update']"
            >
              取消
            </el-button>
          </template>
          <!-- 所有状态：详情 -->
          <el-button
            link
            type="primary"
            @click="openForm('detail', scope.row.id)"
            v-hasPermi="['mes:pro-workorder:query']"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <WorkorderForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { ProWorkorderApi, ProWorkorderVO } from '@/api/mes/pro/workorder'
import WorkorderForm from './WorkorderForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesProWorkorderStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesProWorkorder' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ProWorkorderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  type: undefined,
  orderSourceType: undefined,
  status: undefined,
  requestDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProWorkorderApi.getWorkorderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProWorkorderApi.deleteWorkorder(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 完成工单 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认要完成该工单吗？')
    await ProWorkorderApi.finishWorkorder(id)
    message.success('工单已完成')
    await getList()
  } catch {}
}

/** 取消工单 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认要取消该工单吗？')
    await ProWorkorderApi.cancelWorkorder(id)
    message.success('工单已取消')
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProWorkorderApi.exportWorkorder(queryParams)
    download.excel(data, '生产工单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
