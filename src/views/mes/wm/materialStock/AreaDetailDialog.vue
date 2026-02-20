<!-- 库位详情弹窗（只读） -->
<!-- TODO @AI：复用 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/warehouse/area/AreaForm.vue；需要对方组件，增加一个 detail 模式 -->
<template>
  <Dialog v-model="dialogVisible" title="库位详情" width="600px">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="库位编码">{{ detailData.code }}</el-descriptions-item>
      <el-descriptions-item label="库位名称">{{ detailData.name }}</el-descriptions-item>
      <el-descriptions-item label="面积（㎡）">{{ detailData.area }}</el-descriptions-item>
      <el-descriptions-item label="最大载重（kg）">{{ detailData.maxLoad }}</el-descriptions-item>
      <el-descriptions-item label="允许混放物料">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detailData.allowItemMixing" />
      </el-descriptions-item>
      <el-descriptions-item label="允许混放批次">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detailData.allowBatchMixing" />
      </el-descriptions-item>
      <el-descriptions-item label="位置X">{{ detailData.positionX }}</el-descriptions-item>
      <el-descriptions-item label="位置Y">{{ detailData.positionY }}</el-descriptions-item>
      <el-descriptions-item label="位置Z">{{ detailData.positionZ }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="detailData.status" />
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ detailData.remark }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { WmWarehouseAreaApi, WmWarehouseAreaVO } from '@/api/mes/wm/warehouse/area'

defineOptions({ name: 'MesWmMaterialStockAreaDetailDialog' })

const dialogVisible = ref(false)
const detailData = ref<Partial<WmWarehouseAreaVO>>({})

/** 打开弹窗 */
const open = async (areaId: number) => {
  dialogVisible.value = true
  detailData.value = await WmWarehouseAreaApi.getWarehouseArea(areaId)
}

defineExpose({ open })
</script>
