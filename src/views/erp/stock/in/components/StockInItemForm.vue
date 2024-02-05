<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    v-loading="formLoading"
    label-width="0px"
    :inline-message="true"
  >
    <el-table :data="formData" show-summary class="-mt-10px">
      <el-table-column label="序号" type="index" width="60" />
      <el-table-column label="仓库名称" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.warehouseId`"
            :rules="formRules.warehouseId"
            class="mb-0px!"
          >
            <el-input v-model="row.warehouseId" placeholder="请输入仓库编号" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.productId`" :rules="formRules.productId" class="mb-0px!">
            <el-input v-model="row.productId" placeholder="请输入产品编号" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="条码" min-width="150">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productId" placeholder="请输入条码" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="单位" min-width="150">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productUnitId" placeholder="请输入单位编号" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="数量" prop="count" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.count`" :rules="formRules.count" class="mb-0px!">
            <el-input v-model="row.count" placeholder="请输入商品数量" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="商品单价" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.productPrice`"
            :rules="formRules.productPrice"
            class="mb-0px!"
          >
            <el-input v-model="row.productPrice" placeholder="请输入商品单价" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="合计金额" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.totalPrice`"
            :rules="formRules.totalPrice"
            class="mb-0px!"
          >
            <el-input v-model="row.totalPrice" placeholder="请输入合计金额，单位：元" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.remark`" :rules="formRules.remark" class="mb-0px!">
            <el-input v-model="row.remark" placeholder="请输入备注" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button @click="handleDelete($index)" link>—</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加入库产品</el-button>
  </el-row>
</template>
<script setup lang="ts">
import { StockInApi } from '@/api/erp/stock/in'

const props = defineProps<{
  inId: undefined // 入库编号（主表的关联字段）
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref([])
const formRules = reactive({
  inId: [{ required: true, message: '入库编号不能为空', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '仓库编号不能为空', trigger: 'blur' }],
  productId: [{ required: true, message: '产品编号不能为空', trigger: 'blur' }],
  productUnitId: [{ required: true, message: '商品单位编号不能为空', trigger: 'blur' }],
  productPrice: [{ required: true, message: '商品单价不能为空', trigger: 'blur' }],
  count: [{ required: true, message: '商品数量不能为空', trigger: 'blur' }],
  totalPrice: [{ required: true, message: '合计金额，单位：元不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.inId,
  async (val) => {
    // 1. 重置表单
    formData.value = []
    // 2. val 非空，则加载数据
    if (!val) {
      return
    }
    try {
      formLoading.value = true
      formData.value = await StockInApi.getStockInItemListByInId(val)
    } finally {
      formLoading.value = false
    }
  },
  { immediate: true }
)

/** 新增按钮操作 */
const handleAdd = () => {
  const row = {
    id: undefined,
    inId: undefined,
    warehouseId: undefined,
    productId: undefined,
    productUnitId: undefined,
    productPrice: undefined,
    count: undefined,
    totalPrice: undefined,
    remark: undefined
  }
  row.inId = props.inId
  formData.value.push(row)
}

/** 删除按钮操作 */
const handleDelete = (index) => {
  formData.value.splice(index, 1)
}

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 表单值 */
const getData = () => {
  return formData.value
}

defineExpose({ validate, getData })
</script>
