<!-- 商机的选择列表 TODO 芋艿：后面看看要不要搞到统一封装里 -->
<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" title="选择商机" width="700">
    <el-table
      ref="multipleTableRef"
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column align="center" label="商机名称" prop="name" />
      <el-table-column align="center" label="客户名称" prop="customerName" />
      <el-table-column align="center" label="商机金额" prop="price" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="预计成交日期"
        prop="dealTime"
        width="180px"
      />
      <el-table-column align="center" label="备注" prop="remark" />
    </el-table>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as BusinessApi from '@/api/crm/business'
import { dateFormatter } from '@/utils/formatTime'
import { ElTable } from 'element-plus'

defineOptions({ name: 'BusinessTableSelect' })
withDefaults(defineProps<{ modelValue: number[] }>(), { modelValue: () => [] })

const list = ref<BusinessApi.BusinessVO[]>([]) // 列表的数据
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false)

// 确认选择时的触发事件
const emits = defineEmits<{
  (e: 'update:modelValue', v: number[]): void
}>()
const multipleTableRef = ref<InstanceType<typeof ElTable>>()
const multipleSelection = ref<BusinessApi.BusinessVO[]>([])
const handleSelectionChange = (val: BusinessApi.BusinessVO[]) => {
  multipleSelection.value = val
}
/** 触发 */
const submitForm = () => {
  formLoading.value = true
  try {
    emits(
      'update:modelValue',
      multipleSelection.value.map((item) => item.id)
    )
  } finally {
    formLoading.value = false
    // 关闭弹窗
    dialogVisible.value = false
  }
}

const getList = async () => {
  loading.value = true
  try {
    list.value = await BusinessApi.getSimpleBusinessList()
  } finally {
    loading.value = false
  }
}

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  await nextTick()
  if (multipleSelection.value.length > 0) {
    multipleTableRef.value!.clearSelection()
  }
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
