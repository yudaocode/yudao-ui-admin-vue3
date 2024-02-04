<!-- 合同详情：产品列表 -->
<template>
  <el-table :data="list" :show-overflow-tooltip="true" :stripe="true">
    <el-table-column align="center" label="产品名称" prop="name" width="160" />
    <el-table-column align="center" label="产品类型" prop="categoryName" width="160" />
    <el-table-column align="center" label="产品单位" prop="unit">
      <template #default="scope">
        <dict-tag :type="DICT_TYPE.CRM_PRODUCT_UNIT" :value="scope.row.unit" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="产品编码" prop="no" />
    <el-table-column
      :formatter="fenToYuanFormat"
      align="center"
      label="价格（元）"
      prop="price"
      width="100"
    />
    <el-table-column align="center" label="数量" prop="count" width="200" />
    <el-table-column align="center" label="折扣(%)" prop="discountPercent" width="200" />
    <el-table-column align="center" label="合计" prop="totalPrice" width="100">
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        {{ getTotalPrice(row) }}
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import { fenToYuanFormat } from '@/utils/formatter'
import * as ProductApi from '@/api/crm/product'
import { floatToFixed2, yuanToFen } from '@/utils'

defineOptions({ name: 'ContractProductList' })
const props = withDefaults(defineProps<{ modelValue: ProductApi.ProductExpandVO[] }>(), {
  modelValue: () => []
})
const list = ref<ProductApi.ProductExpandVO[]>([]) // 产品列表

/** 计算 totalPrice */
const getTotalPrice = computed(() => (row: ProductApi.ProductExpandVO) => {
  const totalPrice =
    (Number(row.price) / 100) * Number(row.count) * (1 - Number(row.discountPercent) / 100)
  row.totalPrice = isNaN(totalPrice) ? 0 : yuanToFen(totalPrice)
  return isNaN(totalPrice) ? 0 : totalPrice.toFixed(2)
})

/** 编辑时合同产品回显 */
const isSetListValue = ref(false) // 判断是否已经给 list 赋值过，用于编辑表单产品回显
watch(
  () => props.modelValue,
  (val) => {
    if (!val || val.length === 0 || isSetListValue.value) {
      return
    }
    list.value = [
      ...props.modelValue.map((item) => {
        item.totalPrice = floatToFixed2(item.totalPrice) as unknown as number
        return item
      })
    ]
    isSetListValue.value = true
  },
  { immediate: true, deep: true }
)
</script>
