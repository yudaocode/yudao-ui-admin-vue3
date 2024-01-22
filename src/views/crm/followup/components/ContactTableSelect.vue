<!-- 联系人的选择列表 TODO 芋艿：后面看看要不要搞到统一封装里 -->
<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" title="选择联系人" width="700">
    <el-table
      ref="multipleTableRef"
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column align="center" fixed="left" label="姓名" prop="name" width="140" />
      <el-table-column
        align="center"
        fixed="left"
        label="客户名称"
        prop="customerName"
        width="120"
      />
      <el-table-column align="center" label="手机" prop="mobile" width="120" />
      <el-table-column align="center" label="电话" prop="telephone" width="120" />
      <el-table-column align="center" label="邮箱" prop="email" width="120" />
      <el-table-column align="center" label="职位" prop="post" width="120" />
    </el-table>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as ContactApi from '@/api/crm/contact'
import { ElTable } from 'element-plus'

defineOptions({ name: 'ContactTableSelect' })
withDefaults(defineProps<{ modelValue: number[] }>(), { modelValue: () => [] })

const list = ref<ContactApi.ContactVO[]>([]) // 列表的数据
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false)

// 确认选择时的触发事件
const emits = defineEmits<{
  (e: 'update:modelValue', v: number[]): void
}>()
const multipleTableRef = ref<InstanceType<typeof ElTable>>()
const multipleSelection = ref<ContactApi.ContactVO[]>([])
const handleSelectionChange = (val: ContactApi.ContactVO[]) => {
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
    list.value = await ContactApi.getSimpleContactList()
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
