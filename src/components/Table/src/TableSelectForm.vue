<!-- 列表选择通用组件，参考 ProductList 组件使用 -->
<!-- TODO 芋艿：可能会移除 -->
<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" :scroll="true" :title="title" width="60%">
    <el-table
      ref="multipleTableRef"
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <slot></slot>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ElTable } from 'element-plus'

defineOptions({ name: 'TableSelectForm' })
withDefaults(
  defineProps<{
    modelValue: any[]
    title: string
  }>(),
  { modelValue: () => [], title: '选择' }
)
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})
// 确认选择时的触发事件
const emits = defineEmits<{
  (e: 'update:modelValue', v: number[]): void
}>()
const multipleTableRef = ref<InstanceType<typeof ElTable>>()
const multipleSelection = ref<any[]>([])
const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val
}
/** 触发 */
const submitForm = () => {
  formLoading.value = true
  try {
    emits('update:modelValue', multipleSelection.value) // 返回选择的原始数据由使用方处理
  } finally {
    formLoading.value = false
    // 关闭弹窗
    dialogVisible.value = false
  }
}

const getList = async (getListFunc: Function) => {
  loading.value = true
  try {
    const data = await getListFunc(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开弹窗 */
const open = async (getListFunc: Function) => {
  dialogVisible.value = true
  await nextTick()
  if (multipleSelection.value.length > 0) {
    multipleTableRef.value!.clearSelection()
  }
  await getList(getListFunc)
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
