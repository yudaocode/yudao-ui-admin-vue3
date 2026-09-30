<template>
  <Dialog v-model="dialogVisible" title="还车申请详情" width="900px">
    <VehicleReturnDetail v-if="dialogVisible && detailId" :key="detailId" :id="detailId" />
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import VehicleReturnDetail from './detail/index.vue'

defineOptions({ name: 'OaVehicleReturnDetail' })

const dialogVisible = ref(false) // 弹窗是否展示
const detailId = ref<number>() // 申请编号

/** 打开弹窗 */
function open(id: number) {
  detailId.value = id
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
