<!-- MES 排产 Drawer：展示工单概要 + 工序步骤导航 + 当前工序的任务列表 -->
<template>
  <el-drawer v-model="visible" title="排产" size="75%" :destroy-on-close="true">
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
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { ProRouteProcessApi, ProRouteProcessVO } from '@/api/mes/pro/route/process'
import { ProRouteProductApi } from '@/api/mes/pro/route/product'
import ProTaskList from './ProTaskList.vue'

defineOptions({ name: 'ScheduleDrawer' })

// ==================== Drawer 状态 ====================
const visible = ref(false)
const currentWorkOrder = ref<any>(null)
const routeProcessList = ref<ProRouteProcessVO[]>([])
const activeProcessStep = ref(0)
const currentRouteId = ref(0)

/** 当前选中的工序 */
const currentProcess = computed(() => {
  return routeProcessList.value[activeProcessStep.value]
})

/**
 * 打开排产 Drawer
 *
 * @param row 工单行数据（ProWorkOrderVO）
 */
const open = async (row: any) => {
  currentWorkOrder.value = row
  visible.value = true
  activeProcessStep.value = 0
  routeProcessList.value = []

  // 通过产品查找工艺路线，再加载工序列表
  try {
    // 临时方案：查所有工艺路线产品，前端匹配（后续需后端提供"根据产品查询工艺路线"接口）
    const routeProducts = await ProRouteProductApi.getRouteProductListByRoute(0)
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

/** 工序步骤切换（el-steps @change） */
const handleStepChange = (index: number) => {
  activeProcessStep.value = index
}

/** 工序步骤点击 */
const handleStepClick = (index: number) => {
  activeProcessStep.value = index
}

defineExpose({ open })
</script>
