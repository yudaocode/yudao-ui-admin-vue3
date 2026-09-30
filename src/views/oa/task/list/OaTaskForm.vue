<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <!-- 基础信息 -->
      <el-form-item label="任务标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入任务标题"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="任务类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择任务类型" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_TASK_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="接收人" prop="receiverUserIds">
            <UserSelectV2
              v-model="formData.receiverUserIds"
              multiple
              placeholder="请选择任务接收人"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 任务状态与设置 -->
      <el-row>
        <el-col :span="8">
          <el-form-item label="任务状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择任务状态" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_TASK_STATUS)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="置顶" prop="top">
            <el-switch v-model="formData.top" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="取消" prop="canceled">
            <el-switch v-model="formData.canceled" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 任务周期 -->
      <el-row>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              placeholder="请选择开始时间"
              class="!w-full"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              placeholder="请选择结束时间"
              class="!w-full"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 任务内容 -->
      <el-form-item label="任务描述" prop="description">
        <el-input
          v-model="formData.description"
          placeholder="请输入任务描述"
          :rows="5"
          maxlength="2000"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="任务评价" prop="comment">
        <el-input
          v-model="formData.comment"
          placeholder="请输入任务评价"
          :rows="3"
          maxlength="1000"
          show-word-limit
          type="textarea"
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
import dayjs from 'dayjs'
import * as TaskApi from '@/api/oa/task'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import { OA_TASK_TYPE, OA_TASK_STATUS } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaTaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单的类型：create - 新增；update - 修改
const formData = ref<TaskApi.OaTaskVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  title: [{ required: true, message: '任务标题不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '任务类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '任务状态不能为空', trigger: 'change' }],
  receiverUserIds: [{ required: true, message: '任务接收人不能为空', trigger: 'change' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'change' }],
  description: [{ required: true, message: '任务描述不能为空', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref

const emit = defineEmits<{ success: [] }>()

/** 打开表单 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，加载任务详情
  if (id) {
    formLoading.value = true
    try {
      const task = await TaskApi.getTask(id)
      formData.value = {
        ...task,
        receiverUserIds: task.receivers?.map((receiver) => receiver.userId) || []
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
async function submitForm() {
  // 校验表单和任务时间
  await formRef.value?.validate()
  if (Number(formData.value.endTime) <= Number(formData.value.startTime)) {
    message.error('结束时间必须晚于开始时间')
    return
  }

  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await TaskApi.createTask(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await TaskApi.updateTask(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
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

/** 创建任务默认表单数据 */
function createDefaultFormData(): TaskApi.OaTaskVO {
  const startTime = dayjs().second(0).millisecond(0)
  return {
    type: OA_TASK_TYPE.WORK,
    status: OA_TASK_STATUS.NEW,
    top: false,
    canceled: false,
    title: '',
    description: '',
    comment: undefined,
    startTime: startTime.valueOf(),
    endTime: startTime.add(1, 'day').valueOf(),
    receiverUserIds: []
  }
}
</script>
