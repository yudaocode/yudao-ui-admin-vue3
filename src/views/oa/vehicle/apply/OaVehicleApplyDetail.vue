<template>
  <Dialog v-model="dialogVisible" title="用车申请详情" width="900px">
    <!-- 复用独立业务详情，列表与 BPM 审批页保持一致 -->
    <VehicleApplyDetail v-if="dialogVisible && detailId" :key="detailId" :id="detailId" />
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import VehicleApplyDetail from './detail/index.vue'

defineOptions({ name: 'OaVehicleApplyDetail' })

const dialogVisible = ref(false) // 弹窗是否展示
const detailId = ref<number>() // 申请编号

/** 打开弹窗 */
function open(id: number) {
  detailId.value = id
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
