<template>
  <Dialog v-model="dialogVisible" title="领用申请详情" width="1000px">
    <SupplyApplyDetail v-if="dialogVisible && detailId" :key="detailId" :id="detailId" />
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import SupplyApplyDetail from './detail/index.vue'

defineOptions({ name: 'OaSupplyApplyDetail' })

const dialogVisible = ref(false) // 弹窗是否展示
const detailId = ref<number>() // 申请编号

/** 打开弹窗 */
function open(id: number) {
  detailId.value = id
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
