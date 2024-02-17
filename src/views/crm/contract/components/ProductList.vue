<!-- 合同 Form 表单下的 Product 列表 -->
<template>
  <el-row justify="end">
    <el-button plain type="primary" @click="openForm">添加产品</el-button>
  </el-row>
  <el-table :data="list" :show-overflow-tooltip="true" :stripe="true">
    <el-table-column align="center" label="产品名称" prop="name" width="120" />
    <el-table-column
      :formatter="fenToYuanFormat"
      align="center"
      label="价格"
      prop="price"
      width="100"
    />
    <el-table-column align="center" label="产品类型" prop="categoryName" width="100" />
    <el-table-column align="center" label="产品单位" prop="unit">
      <template #default="scope">
        <dict-tag :type="DICT_TYPE.CRM_PRODUCT_UNIT" :value="scope.row.unit" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="产品编码" prop="no" />
    <el-table-column align="center" fixed="right" label="数量" prop="count" width="100">
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        <el-input-number
          v-model="row.count"
          controls-position="right"
          :min="0"
          :precision="0"
          class="!w-100%"
        />
      </template>
    </el-table-column>
    <el-table-column
      align="center"
      fixed="right"
      label="折扣(%)"
      prop="discountPercent"
      width="120"
    >
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        <el-input-number
          v-model="row.discountPercent"
          controls-position="right"
          :min="0"
          :max="100"
          :precision="0"
          class="!w-100%"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" fixed="right" label="合计" prop="totalPrice" width="100">
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        {{ fenToYuan(getTotalPrice(row)) }}
      </template>
    </el-table-column>
    <el-table-column align="center" fixed="right" label="操作" width="60">
      <template #default="scope">
        <el-button link type="danger" @click="handleDelete(scope.row.id)"> 移除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- table 选择表单 -->
  <TableSelectForm ref="tableSelectFormRef" v-model="multipleSelection" title="选择产品">
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
  </TableSelectForm>
</template>

<script lang="ts" setup>
import * as ProductApi from '@/api/crm/product'
import { DICT_TYPE } from '@/utils/dict'
import { fenToYuanFormat } from '@/utils/formatter'
import { TableSelectForm } from '@/components/Table/index'
import { fenToYuan, floatToFixed2, yuanToFen } from '@/utils'

defineOptions({ name: 'ProductList' })
const props = withDefaults(defineProps<{ modelValue: ProductApi.ProductExpandVO[] }>(), {
  modelValue: () => []
})
const emits = defineEmits<{
  (e: 'update:modelValue', v: any[]): void
}>()

const list = ref<ProductApi.ProductExpandVO[]>([]) // 已添加的产品列表
const multipleSelection = ref<ProductApi.ProductExpandVO[]>([]) // 多选

/** 处理删除 */
const handleDelete = (id: number) => {
  const index = list.value.findIndex((item) => item.id === id)
  if (index !== -1) {
    list.value.splice(index, 1)
  }
}

/** 打开 Product 弹窗  */
const tableSelectFormRef = ref<InstanceType<typeof TableSelectForm>>()
const openForm = () => {
  tableSelectFormRef.value?.open(ProductApi.getProductPage)
}

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

/** 监听列表变化，动态更新合同产品列表 */
watch(
  list,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    emits('update:modelValue', list.value)
  },
  { deep: true }
)

// 监听产品选择结果动态添加产品到列表中,如果产品存在则不放入列表中
watch(
  multipleSelection,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    // 过滤出不在列表中的产品
    const ids = list.value.map((item) => item.id)
    const productList = multipleSelection.value.filter((item) => ids.indexOf(item.id) === -1)
    if (!productList || productList.length === 0) {
      return
    }
    list.value.push(...productList)
  },
  { deep: true }
)
</script>
