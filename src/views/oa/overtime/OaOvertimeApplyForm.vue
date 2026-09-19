<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题" maxlength="255" />
      </el-form-item>
      <el-form-item label="紧急程度" prop="urgency">
        <el-select v-model="formData.urgency" placeholder="请选择紧急程度" class="!w-full">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_APPLY_URGENCY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="加班类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择加班类型" class="!w-full">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_OVERTIME_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="formData.startTime"
          type="datetime"
          value-format="x"
          placeholder="请选择开始时间"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="datetime"
          value-format="x"
          placeholder="请选择结束时间"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="申请原因" prop="reason">
        <el-input
          v-model="formData.reason"
          maxlength="5000"
          placeholder="请输入申请原因"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
      <el-form-item label="天数">
        <el-input :model-value="days" disabled>
          <template #append>天</template>
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">保 存</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as OvertimeApplyApi from '@/api/oa/overtime'
import type { FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'OaOvertimeApplyForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<OvertimeApplyApi.OvertimeApplyVO>({}) // 表单数据
const formRules = reactive<FormRules>({
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  urgency: [{ required: true, message: '紧急程度不能为空', trigger: 'change' }],
  type: [{ required: true, message: '加班类型不能为空', trigger: 'change' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'change' }],
  reason: [{ required: true, message: '申请原因不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 按申请起止时间计算天数 */
const days = computed(() => {
  if (!formData.value.startTime || !formData.value.endTime) return undefined
  // 按整数毫秒保留一位小数，与后端 HALF_UP 一致（0.15 天为 0.2 天）。
  const duration = Number(formData.value.endTime) - Number(formData.value.startTime)
  return Math.round(duration / (24 * 60 * 60 * 100)) / 10
})

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await OvertimeApplyApi.getOvertimeApply(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 提交表单 */
async function submitForm() {
  // 校验表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await OvertimeApplyApi.createOvertimeApply(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await OvertimeApplyApi.updateOvertimeApply(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {}
  formRef.value?.resetFields()
}
</script>
