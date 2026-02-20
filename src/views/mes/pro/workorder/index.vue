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
      <el-form-item label="产品" prop="productId">
        <MdItemSelect v-model="queryParams.productId" placeholder="请选择产品" class="!w-240px" />
      </el-form-item>
      <el-form-item label="客户" prop="clientId">
        <MdClientSelect v-model="queryParams.clientId" placeholder="请选择客户" class="!w-240px" />
      </el-form-item>
      <el-form-item label="工单类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择工单类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="工单来源" prop="orderSourceType">
        <el-select
          v-model="queryParams.orderSourceType"
          placeholder="请选择工单来源"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE)"
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
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_STATUS)"
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
          v-hasPermi="['mes:pro-work-order:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:pro-work-order:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column label="工单编码" align="center" prop="code" width="140" />
      <el-table-column label="工单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="工单类型" align="center" prop="type" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="工单来源" align="center" prop="orderSourceType" width="100">
        <template #default="scope">
          <dict-tag
            :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE"
            :value="scope.row.orderSourceType"
          />
        </template>
      </el-table-column>
      <el-table-column label="来源单据编号" align="center" prop="orderSourceCode" width="140" />
      <el-table-column label="产品编码" align="center" prop="productCode" width="120" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="120" />
      <el-table-column label="规格型号" align="center" prop="productSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="工单数量" align="center" prop="quantity" width="100" />
      <el-table-column label="已生产数量" align="center" prop="quantityProduced" width="100" />
      <el-table-column label="客户编码" align="center" prop="clientCode" width="120" />
      <el-table-column label="客户名称" align="center" prop="clientName" width="120" />
      <el-table-column
        label="需求日期"
        align="center"
        prop="requestDate"
        :formatter="dateFormatter2"
        width="180"
      />
      <el-table-column label="工单状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿状态：编辑、确认、删除 -->
          <template v-if="scope.row.status === MesProWorkOrderStatusEnum.PREPARE">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['mes:pro-work-order:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="success"
              @click="handleConfirm(scope.row.id)"
              v-hasPermi="['mes:pro-work-order:update']"
            >
              确认
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:pro-work-order:delete']"
            >
              删除
            </el-button>
          </template>
          <!-- 已确认 + 自行生产：新增子工单 -->
          <el-button
            v-if="
              scope.row.status === MesProWorkOrderStatusEnum.CONFIRMED &&
              scope.row.type === MesProWorkOrderTypeEnum.SELF
            "
            link
            type="primary"
            @click="handleAddChild(scope.row)"
            v-hasPermi="['mes:pro-work-order:create']"
          >
            新增
          </el-button>
          <!-- 已确认状态：完成、取消 -->
          <template v-if="scope.row.status === MesProWorkOrderStatusEnum.CONFIRMED">
            <el-button
              link
              type="success"
              @click="handleFinish(scope.row.id)"
              v-hasPermi="['mes:pro-work-order:update']"
            >
              完成
            </el-button>
            <el-button
              link
              type="warning"
              @click="handleCancel(scope.row.id)"
              v-hasPermi="['mes:pro-work-order:update']"
            >
              取消
            </el-button>
          </template>
          <!-- 所有状态：详情 -->
          <el-button
            link
            type="primary"
            @click="openForm('detail', scope.row.id)"
            v-hasPermi="['mes:pro-work-order:query']"
          >
            详情
          </el-button>
          <!-- TODO @芋艿：预览（打印） -->
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
  <WorkOrderForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import download from '@/utils/download'
import { handleTree } from '@/utils/tree'
import { ProWorkOrderApi, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import WorkOrderForm from './WorkOrderForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/views/mes/utils/constants'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'

defineOptions({ name: 'MesProWorkOrder' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<ProWorkOrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  productId: undefined,
  clientId: undefined,
  type: undefined,
  orderSourceType: undefined,
  status: undefined,
  requestDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表（分页 + 前端 handleTree 拼接树） */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProWorkOrderApi.getWorkOrderPage(queryParams)
    list.value = handleTree(data.list, 'id', 'parentId')
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
const openForm = (type: string, id?: number, parentRow?: any) => {
  formRef.value.open(type, id, parentRow)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProWorkOrderApi.deleteWorkOrder(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 确认工单 */
const handleConfirm = async (id: number) => {
  try {
    await message.confirm('确认要完成工单编制吗？确认后将不能更改')
    await ProWorkOrderApi.confirmWorkOrder(id)
    message.success('工单已确认')
    await getList()
  } catch {}
}

/** 新增子工单 */
const handleAddChild = (row: any) => {
  openForm('create', undefined, row)
}

/** 完成工单 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认要完成该工单吗？')
    await ProWorkOrderApi.finishWorkOrder(id)
    message.success('工单已完成')
    await getList()
  } catch {}
}

/** 取消工单 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认要取消该工单吗？')
    await ProWorkOrderApi.cancelWorkOrder(id)
    message.success('工单已取消')
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProWorkOrderApi.exportWorkOrder(queryParams)
    download.excel(data, '生产工单.xls')
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
