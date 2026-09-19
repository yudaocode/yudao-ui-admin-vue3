<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="90px"
    >
      <!-- 基础信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="日程类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择日程类型" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_SCHEDULE_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formData.priority" placeholder="请选择优先级" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_PRIORITY)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="日程标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入日程标题"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
      <!-- 日程时间 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              value-format="x"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              value-format="x"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 参与和提醒 -->
      <el-form-item label="参与人">
        <UserSelectV2 v-model="formData.participantUserIds" multiple placeholder="请选择参与人" />
      </el-form-item>
      <el-form-item label="日程提醒" prop="remind">
        <el-switch v-model="formData.remind" />
      </el-form-item>
      <el-form-item label="日程描述">
        <el-input
          v-model="formData.description"
          placeholder="请输入日程描述"
          type="textarea"
          :rows="4"
          maxlength="1000"
        />
      </el-form-item>
    </el-form>
    <!-- 表单操作 -->
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance, FormRules } from 'element-plus'
import * as ScheduleApi from '@/api/oa/schedule'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import { OA_PRIORITY, OA_SCHEDULE_TYPE } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaScheduleForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改
const formData = ref<ScheduleApi.OaScheduleVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '日程类型不能为空', trigger: 'change' }],
  priority: [{ required: true, message: '优先级不能为空', trigger: 'change' }],
  title: [{ required: true, message: '日程标题不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增日程' : '修改日程'
  formType.value = type
  resetForm()

  // 修改时，加载日程详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ScheduleApi.getSchedule(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value || formLoading.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 校验日程时间
  if (Number(formData.value.endTime) <= Number(formData.value.startTime)) {
    message.error('结束时间必须晚于开始时间')
    return
  }

  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ScheduleApi.createSchedule(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ScheduleApi.updateSchedule(formData.value)
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
  formData.value = createDefaultFormData()
  formRef.value?.resetFields()
}

/** 创建日程默认表单数据 */
function createDefaultFormData(): ScheduleApi.OaScheduleVO {
  return {
    type: OA_SCHEDULE_TYPE.REMINDER,
    priority: OA_PRIORITY.NORMAL,
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    remind: false,
    participantUserIds: []
  }
}
</script>
