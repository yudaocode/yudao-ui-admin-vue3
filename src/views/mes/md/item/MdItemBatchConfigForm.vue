<!-- MES 物料批次属性配置 -->
<template>
  <el-form ref="formRef" :model="formData" v-loading="loading">
    <div class="flex justify-end mb-10px">
      <el-button type="primary" size="small" @click="handleSave" :loading="loading">保存批次属性</el-button>
    </div>
    <div class="batch-config-grid">
      <!-- 通用属性（ITEM 和 PRODUCT 都可见） -->
      <el-checkbox v-model="formData.produceDateFlag">生产日期</el-checkbox>
      <el-checkbox v-model="formData.qualityStatusFlag">质量状态</el-checkbox>

      <!-- ITEM（原材料）特有属性 -->
      <template v-if="itemOrProduct === MesItemOrProductEnum.ITEM.value">
        <el-checkbox v-model="formData.vendorFlag">供应商</el-checkbox>
        <el-checkbox v-model="formData.purchaseOrderCodeFlag">采购订单编号</el-checkbox>
        <el-checkbox v-model="formData.lotNumberFlag">生产批号</el-checkbox>
        <el-checkbox v-model="formData.expireDateFlag">有效期</el-checkbox>
        <el-checkbox v-model="formData.receiptDateFlag">入库日期</el-checkbox>
      </template>

      <!-- PRODUCT（产品）特有属性 -->
      <template v-if="itemOrProduct === MesItemOrProductEnum.PRODUCT.value">
        <el-checkbox v-model="formData.clientFlag">客户</el-checkbox>
        <el-checkbox v-model="formData.salesOrderCodeFlag">销售订单编号</el-checkbox>
        <el-checkbox v-model="formData.workorderFlag">生产工单</el-checkbox>
        <el-checkbox v-model="formData.taskFlag">生产任务</el-checkbox>
        <el-checkbox v-model="formData.workstationFlag">工位</el-checkbox>
        <el-checkbox v-model="formData.toolFlag">工具</el-checkbox>
        <el-checkbox v-model="formData.moldFlag">模具</el-checkbox>
      </template>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { MdItemBatchConfigApi, MdItemBatchConfigVO } from '@/api/mes/md/item/batchConfig'
import { MesItemOrProductEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MdItemBatchConfigForm' })

const props = defineProps<{
  itemId: number
  itemOrProduct: string // 'ITEM' | 'PRODUCT'
}>()

const message = useMessage()
const loading = ref(false)
const formRef = ref()
const formData = ref<MdItemBatchConfigVO>({
  itemId: props.itemId,
  produceDateFlag: false,
  expireDateFlag: false,
  receiptDateFlag: false,
  vendorFlag: false,
  clientFlag: false,
  salesOrderCodeFlag: false,
  purchaseOrderCodeFlag: false,
  workorderFlag: false,
  taskFlag: false,
  workstationFlag: false,
  toolFlag: false,
  moldFlag: false,
  lotNumberFlag: false,
  qualityStatusFlag: false
})

/** 加载已有配置 */
const loadData = async () => {
  loading.value = true
  try {
    const data = await MdItemBatchConfigApi.getBatchConfigByItemId(props.itemId)
    if (data) {
      formData.value = { ...formData.value, ...data }
    }
  } finally {
    loading.value = false
  }
}

/** 保存 */
const handleSave = async () => {
  // 校验至少选中一个属性
  const hasAny =
    formData.value.produceDateFlag ||
    formData.value.expireDateFlag ||
    formData.value.receiptDateFlag ||
    formData.value.vendorFlag ||
    formData.value.clientFlag ||
    formData.value.salesOrderCodeFlag ||
    formData.value.purchaseOrderCodeFlag ||
    formData.value.workorderFlag ||
    formData.value.taskFlag ||
    formData.value.workstationFlag ||
    formData.value.toolFlag ||
    formData.value.moldFlag ||
    formData.value.lotNumberFlag ||
    formData.value.qualityStatusFlag
  if (!hasAny) {
    message.warning('至少选择一个批次属性')
    return
  }

  loading.value = true
  try {
    formData.value.itemId = props.itemId
    await MdItemBatchConfigApi.saveBatchConfig(formData.value)
    message.success('保存成功')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.batch-config-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0 20px;
}
</style>
