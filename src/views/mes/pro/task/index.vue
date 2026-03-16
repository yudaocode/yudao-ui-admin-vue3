<!-- MES 生产排产 -->
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
      <el-form-item label="来源单据" prop="orderSourceCode">
        <el-input
          v-model="queryParams.orderSourceCode"
          placeholder="请输入来源单据编号"
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
        <el-button type="warning" plain @click="openGanttEdit">
          <Icon icon="ep:data-analysis" class="mr-5px" /> 甘特图编辑
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 甘特图预览 -->
  <ContentWrap title="排产甘特图">
    <GanttChart :tasks="ganttTasks" :readonly="true" :height="350" />
  </ContentWrap>

  <!-- 待排产工单列表 -->
  <ContentWrap title="待排产工单">
    <el-table
      v-loading="loading"
      :data="workOrderList"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column label="工单编码" prop="code" width="220" fixed="left">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="工单名称" align="center" prop="name" min-width="150" />
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
      <el-table-column label="调整数量" align="center" prop="quantityChanged" width="100" />
      <el-table-column label="已生产数量" align="center" prop="quantityProduced" width="100" />
      <el-table-column label="客户编码" align="center" prop="clientCode" width="120" />
      <el-table-column label="客户名称" align="center" prop="clientName" width="120" />
      <el-table-column
        label="需求日期"
        align="center"
        prop="requestDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="排产状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            v-if="scope.row.status === MesProWorkOrderStatusEnum.CONFIRMED"
            link
            type="primary"
            @click="openForm('schedule', scope.row.id)"
            v-hasPermi="['mes:pro-task:create']"
          >
            排产
          </el-button>
          <el-button
            v-if="scope.row.status === MesProWorkOrderStatusEnum.CONFIRMED"
            link
            type="success"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:pro-task:update']"
          >
            完成
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getWorkOrderList"
    />
  </ContentWrap>

  <!-- 排产对话框（工单详情 + 工序步骤 + 任务列表） -->
  <WorkOrderForm2 ref="formRef" />
  <!-- 甘特图编辑 Dialog -->
  <GanttEdit ref="ganttEditRef" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import { DICT_TYPE } from '@/utils/dict'
import { ProWorkOrderApi, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { ProTaskApi } from '@/api/mes/pro/task'
import { MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/views/mes/utils/constants'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import GanttChart from './components/GanttChart.vue'
import GanttEdit from './GanttEdit.vue'
import WorkOrderForm2 from './WorkOrderForm2.vue'

defineOptions({ name: 'MesProTask' })

const message = useMessage()
const loading = ref(true) // 列表加载状态
const workOrderList = ref<ProWorkOrderVO[]>([]) // 工单列表数据
const total = ref(0) // 总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  orderSourceCode: undefined,
  productId: undefined,
  clientId: undefined,
  requestDate: undefined,
  status: MesProWorkOrderStatusEnum.CONFIRMED, // 固定筛选：只查询"已确认"的工单
  type: MesProWorkOrderTypeEnum.SELF // 固定筛选：只查询"自制"的工单
})
const queryFormRef = ref() // 搜索表单 ref

const ganttLoading = ref(false) // 甘特图加载状态
const ganttTasks = ref<any[]>([]) // 甘特图数据

/** 查询待排产工单列表（支持父子工单树形展示） */
const getWorkOrderList = async () => {
  loading.value = true
  try {
    const data = await ProWorkOrderApi.getWorkOrderPage(queryParams)
    workOrderList.value = handleTree(data.list, 'id', 'parentId')
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载甘特图预览数据（查询所有任务，供甘特图组件渲染） */
const loadGanttPreview = async () => {
  ganttLoading.value = true
  try {
    ganttTasks.value = await ProTaskApi.getGanttTaskList(queryParams)
  } finally {
    ganttLoading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getWorkOrderList()
}

/** 重置 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  // 恢复固定筛选
  queryParams.status = MesProWorkOrderStatusEnum.CONFIRMED
  queryParams.type = MesProWorkOrderTypeEnum.SELF
  // 执行搜索
  handleQuery()
}

/** 打开排产/详情对话框 */
const formRef = ref()
const openForm = (type: string, id: number) => {
  formRef.value.open(type, id)
}

/** 完成工单 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认要完成该工单吗？')
    await ProWorkOrderApi.finishWorkOrder(id)
    message.success('工单已完成')
    await getWorkOrderList()
  } catch {}
}

// TODO @芋艿：后续可以考虑把甘特图预览和编辑合并成一个组件，统一管理甘特图数据和刷新逻辑；
/** 打开甘特图编辑弹窗 */
const ganttEditRef = ref()
const openGanttEdit = () => {
  ganttEditRef.value.open()
}

/** 初始化 */
onMounted(async () => {
  await getWorkOrderList()
  await loadGanttPreview()
})
</script>
