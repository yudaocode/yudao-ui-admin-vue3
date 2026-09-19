<template>
  <Dialog v-model="dialogVisible" title="公文收文详情" width="1000px">
    <OfficialDocReceiveDetail v-if="dialogVisible && detailId" :key="detailId" :id="detailId" />
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import OfficialDocReceiveDetail from './detail/index.vue'

defineOptions({ name: 'OaOfficialDocReceiveDetail' })

const dialogVisible = ref(false) // 弹窗是否展示
const detailId = ref<number>() // 收文编号

/** 打开弹窗 */
function open(id: number) {
  detailId.value = id
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
