<template>
  <Dialog v-model="dialogVisible" title="批次追溯" width="960">
    <el-descriptions :column="3" border>
      <el-descriptions-item label="批次编号">
        {{ detailData.code }}
      </el-descriptions-item>
      <el-descriptions-item label="物资编码">
        {{ detailData.itemCode }}
      </el-descriptions-item>
      <el-descriptions-item label="物资名称">
        {{ detailData.itemName }}
      </el-descriptions-item>
      <el-descriptions-item label="规格型号" :span="3">
        {{ detailData.itemSpecification }}
      </el-descriptions-item>
      <el-descriptions-item label="采购订单编号">
        {{ detailData.purchaseOrderCode }}
      </el-descriptions-item>
      <el-descriptions-item label="供应商编码">
        {{ detailData.vendorCode }}
      </el-descriptions-item>
      <el-descriptions-item label="供应商名称">
        {{ detailData.vendorName }}
      </el-descriptions-item>
      <el-descriptions-item label="销售订单编号">
        {{ detailData.salesOrderCode }}
      </el-descriptions-item>
      <el-descriptions-item label="客户编码">
        {{ detailData.clientCode }}
      </el-descriptions-item>
      <el-descriptions-item label="客户名称">
        {{ detailData.clientName }}
      </el-descriptions-item>
      <el-descriptions-item label="生产批号">
        {{ detailData.lotNumber }}
      </el-descriptions-item>
      <el-descriptions-item label="生产工单">
        {{ detailData.workOrderCode }}
      </el-descriptions-item>
      <el-descriptions-item label="工作站编码">
        {{ detailData.workstationCode }}
      </el-descriptions-item>
    </el-descriptions>
    <el-tabs type="border-card" class="mt-10px">
      <el-tab-pane label="向前追溯">
        <BatchTraceDetailTab
          :batchId="detailData.id"
          :batchCode="detailData.code"
          direction="forward"
        />
      </el-tab-pane>
      <el-tab-pane label="向后追溯">
        <BatchTraceDetailTab
          :batchId="detailData.id"
          :batchCode="detailData.code"
          direction="backward"
        />
      </el-tab-pane>
    </el-tabs>
  </Dialog>
</template>

<script lang="ts" setup>
import { BatchVO } from '@/api/mes/wm/batch'
import BatchTraceDetailTab from './BatchTraceDetailTab.vue'

defineOptions({ name: 'BatchTraceDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailData = ref<BatchVO>({} as BatchVO) // 详情数据

/** 打开弹窗 */
const open = async (data: BatchVO) => {
  dialogVisible.value = true
  detailData.value = data
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
