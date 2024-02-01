<!-- 合同 Form 表单下的 Product 列表 -->
<template>
  <el-row justify="end">
    <el-button plain type="primary" @click="openForm">添加产品</el-button>
  </el-row>
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
    <el-table-column align="center" label="数量" prop="count" width="200">
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        <el-input-number v-model="row.count" class="!w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="折扣(%)" prop="discountPercent" width="200">
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        <el-input-number v-model="row.discountPercent" class="!w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="合计" prop="totalPrice" width="100">
      <template #default="{ row }: { row: ProductApi.ProductExpandVO }">
        {{ getTotalPrice(row) }}
      </template>
    </el-table-column>
    <el-table-column align="center" fixed="right" label="操作" width="130">
      <template #default="scope">
        <el-button link type="danger" @click="handleDelete(scope.row.id)"> 移除</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- table 选择表单 -->
  <TableSelectForm ref="tableSelectFormRef" v-model="multipleSelection" title="选择商品">
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

defineOptions({ name: 'ProductList' })
withDefaults(defineProps<{ modelValue: any[] }>(), { modelValue: () => [] })
const emits = defineEmits<{
  (e: 'update:modelValue', v: any[]): void
}>()

const list = ref<ProductApi.ProductExpandVO[]>([]) //  TODO @puhui999
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
  const totalPrice = (row.price * row.count * row.discountPercent) / 100
  row.totalPrice = isNaN(totalPrice) ? 0 : totalPrice
  return isNaN(totalPrice) ? 0 : totalPrice
})

// TODO @puhui999：注释下
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

// TODO @puhui999：注释下
watch(
  multipleSelection,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    const ids = list.value.map((item) => item.id)
    list.value.push(...multipleSelection.value.filter((item) => ids.indexOf(item.id) === -1))
  },
  { deep: true }
)
</script>
