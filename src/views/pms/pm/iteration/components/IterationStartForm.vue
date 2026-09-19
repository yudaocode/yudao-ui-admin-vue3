<template>
  <Dialog v-model="dialogVisible" title="开始迭代" width="520px">
    <!-- 迭代周期 -->
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="92px">
      <el-form-item label="迭代周期" prop="timeRange">
        <el-date-picker
          v-model="formData.timeRange"
          class="!w-100%"
          end-placeholder="结束时间"
          range-separator="至"
          start-placeholder="开始时间"
          type="datetimerange"
          value-format="x"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as IterationApi from '@/api/pms/pm/iteration'

defineOptions({ name: 'PmsIterationStartForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单提交中
const iterationId = ref(0) // 迭代编号
const formData = ref<{ timeRange: string[] }>({ timeRange: [] }) // 表单数据
const formRules = reactive({
  timeRange: [{ required: true, message: '迭代周期不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
function open(iteration: IterationApi.PmsIterationVO) {
  if (!iteration.id) return
  dialogVisible.value = true
  iterationId.value = iteration.id
  resetForm()
  formData.value.timeRange =
    iteration.startTime && iteration.endTime
      ? [String(iteration.startTime), String(iteration.endTime)]
      : []
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await IterationApi.startIteration({
      id: iterationId.value,
      startTime: Number(formData.value.timeRange[0]),
      endTime: Number(formData.value.timeRange[1])
    })
    message.success('迭代已开始')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = { timeRange: [] }
  formRef.value?.resetFields()
}
</script>
