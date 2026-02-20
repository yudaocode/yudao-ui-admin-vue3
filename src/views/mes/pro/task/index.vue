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
      <!-- TODO @AI：来源单据 -->
      <!-- TODO @AI：产品 xxx；参考下别的模块 -->
      <!-- TODO @AI：客户 xxx；参考下别的模块 -->
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
    <GanttChart ref="ganttPreviewRef" :tasks="ganttTasks" :readonly="true" :height="350" />
  </ContentWrap>

  <!-- 待排产工单列表 -->
  <!-- TODO @AI：这里是父子，在参考下修复；也可以看看 workorder -->
  <ContentWrap title="待排产工单">
    <el-table
      v-loading="loading"
      :data="workOrderList"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="工单编码" align="center" prop="code" width="140" />
      <el-table-column label="工单名称" align="center" prop="name" min-width="150" />
      <!-- TODO @AI：工单来源 -->
      <!-- TODO @AI：订单编号 -->
      <!-- TODO @AI：订单编号 -->
      <el-table-column label="产品编码" align="center" prop="productCode" width="120" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="120" />
      <el-table-column label="规格型号" align="center" prop="productSpec" width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="工单数量" align="center" prop="quantity" width="100" />
      <!-- TODO @AI：调整数量 -->
      <el-table-column label="已排产" align="center" prop="quantityScheduled" width="80" />
      <el-table-column label="已生产数量" align="center" prop="quantityProduced" width="80" />
      <!-- TODO @AI：客户编码 -->
      <el-table-column label="客户名称" align="center" prop="clientName" width="120" />
      <el-table-column
        label="需求日期"
        align="center"
        prop="requestDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openScheduleDrawer(scope.row)"
            v-hasPermi="['mes:pro-task:create']"
          >
            排产
          </el-button>
          <el-button
            link
            type="success"
            @click="openProgressDrawer(scope.row)"
            v-hasPermi="['mes:pro-task:query']"
          >
            进度
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

  <!-- 排产 Drawer -->
  <!-- TODO @AI：是不是要抽出去一个独立组件？是不是使用弹窗？在对齐下； -->
  <el-drawer v-model="scheduleDrawerVisible" title="排产" size="75%" :destroy-on-close="true">
    <div v-if="currentWorkOrder">
      <!-- 工单概要信息 -->
      <el-descriptions :column="3" border class="mb-15px">
        <el-descriptions-item label="工单编码">{{ currentWorkOrder.code }}</el-descriptions-item>
        <el-descriptions-item label="工单名称">{{ currentWorkOrder.name }}</el-descriptions-item>
        <el-descriptions-item label="产品">{{ currentWorkOrder.productName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentWorkOrder.quantity }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentWorkOrder.clientName }}</el-descriptions-item>
        <el-descriptions-item label="需求日期">
          {{ formatDate(currentWorkOrder.requestDate, 'YYYY-MM-DD') }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 工序步骤导航 -->
      <el-steps
        v-if="routeProcessList.length"
        :active="activeProcessStep"
        finish-status="success"
        class="mb-15px"
        @change="handleStepChange"
      >
        <el-step
          v-for="(rp, index) in routeProcessList"
          :key="rp.processId"
          :title="rp.processName"
          :description="'第' + (index + 1) + '道工序'"
          style="cursor: pointer"
          @click="handleStepClick(index)"
        />
      </el-steps>
      <el-empty v-else description="该产品未配置工艺路线，请先在工艺路线中维护" />

      <!-- 当前工序的任务列表 -->
      <ProTaskList
        v-if="currentProcess"
        :work-order-id="currentWorkOrder.id"
        :work-order-code="currentWorkOrder.code"
        :work-order-name="currentWorkOrder.name"
        :route-id="currentRouteId"
        :process-id="currentProcess.processId"
        :item-id="currentWorkOrder.productId"
        :unit-measure-id="currentWorkOrder.unitMeasureId"
        :process-list="routeProcessList"
      />
    </div>
  </el-drawer>

  <!-- 进度 Drawer -->
  <el-drawer v-model="progressDrawerVisible" title="生产进度" size="60%" :destroy-on-close="true">
    <ProTaskProgress v-if="currentWorkOrder" :work-order-id="currentWorkOrder.id" />
  </el-drawer>

  <!-- 甘特图编辑 Dialog -->
  <GanttEdit ref="ganttEditRef" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { ProWorkOrderApi, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import { ProTaskApi } from '@/api/mes/pro/task'
import { ProRouteProcessApi, ProRouteProcessVO } from '@/api/mes/pro/route/process'
import { ProRouteProductApi } from '@/api/mes/pro/route/product'
import { MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/views/mes/utils/constants'
import GanttChart from './components/GanttChart.vue'
import GanttEdit from './GanttEdit.vue'
import ProTaskList from './ProTaskList.vue'
import ProTaskProgress from './ProTaskProgress.vue'

defineOptions({ name: 'MesProTask' })

const loading = ref(true)
const workOrderList = ref<ProWorkOrderVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  requestDate: undefined,
  // 固定筛选：已确认 + 自行生产
  status: MesProWorkOrderStatusEnum.CONFIRMED,
  type: MesProWorkOrderTypeEnum.SELF
})
const queryFormRef = ref()

// 甘特图预览数据
const ganttTasks = ref<any[]>([])
const ganttPreviewRef = ref()

/** 查询待排产工单列表 */
const getWorkOrderList = async () => {
  loading.value = true
  try {
    const data = await ProWorkOrderApi.getWorkOrderPage(queryParams)
    workOrderList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 加载甘特图预览数据（复用 page 接口，传大 pageSize） */
const loadGanttPreview = async () => {
  try {
    const data = await ProTaskApi.getTaskPage({ pageNo: 1, pageSize: 999 })
    ganttTasks.value = data.list
  } catch (e) {
    console.warn('加载甘特图数据失败', e)
    ganttTasks.value = []
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
  handleQuery()
}

// ==================== 排产 Drawer ====================
const scheduleDrawerVisible = ref(false)
const currentWorkOrder = ref<any>(null)
const routeProcessList = ref<ProRouteProcessVO[]>([])
const activeProcessStep = ref(0)
const currentRouteId = ref(0)

const currentProcess = computed(() => {
  return routeProcessList.value[activeProcessStep.value]
})

/** 打开排产 Drawer */
const openScheduleDrawer = async (row: any) => {
  currentWorkOrder.value = row
  scheduleDrawerVisible.value = true
  activeProcessStep.value = 0
  routeProcessList.value = []

  // 通过产品查找工艺路线，再加载工序列表
  try {
    const routeProducts = await ProRouteProductApi.getRouteProductListByRoute(0)
    // TODO @芋艿：需要后端提供"根据产品查询关联的工艺路线"接口
    // 临时方案：查所有工艺路线产品，前端匹配
    const matched = routeProducts?.find((rp: any) => rp.itemId === row.productId)
    if (matched) {
      currentRouteId.value = matched.routeId
      const processes = await ProRouteProcessApi.getRouteProcessListByRoute(matched.routeId)
      routeProcessList.value = processes.sort((a: any, b: any) => a.sort - b.sort)
    }
  } catch (e) {
    console.warn('加载工艺路线工序失败', e)
  }
}

/** 工序步骤切换 */
const handleStepChange = (index: number) => {
  activeProcessStep.value = index
}
const handleStepClick = (index: number) => {
  activeProcessStep.value = index
}

// ==================== 进度 Drawer ====================
const progressDrawerVisible = ref(false)

const openProgressDrawer = (row: any) => {
  currentWorkOrder.value = row
  progressDrawerVisible.value = true
}

// ==================== 甘特图编辑 ====================
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
