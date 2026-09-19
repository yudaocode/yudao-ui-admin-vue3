<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="780px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <!-- 基础信息 -->
      <el-row>
        <el-col :span="12">
          <el-form-item label="计划类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择计划类型"
              class="w-full"
              @change="handlePlanTypeChange"
            >
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_PLAN_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计划状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择计划状态" class="w-full">
              <el-option
                v-for="item in getIntDictOptions(DICT_TYPE.OA_PLAN_STATUS)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="计划标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入计划标题"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="计划标签" prop="label">
        <el-input v-model="formData.label" maxlength="255" placeholder="例如：重点、销售" />
      </el-form-item>
      <!-- 计划周期 -->
      <el-row>
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              placeholder="请选择开始时间"
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
              placeholder="请选择结束时间"
              type="datetime"
              value-format="x"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 计划内容 -->
      <el-form-item label="计划内容" prop="content">
        <el-input
          v-model="formData.content"
          placeholder="请输入计划内容"
          type="textarea"
          :rows="5"
        />
      </el-form-item>
      <el-form-item label="计划总结" prop="summary">
        <el-input
          v-model="formData.summary"
          placeholder="请输入计划总结"
          type="textarea"
          :rows="3"
        />
      </el-form-item>
      <el-form-item v-if="formType === 'update'" label="计划点评">
        <el-input
          :model-value="formData.comment || '暂无点评'"
          type="textarea"
          :rows="3"
          readonly
        />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" :limit="1" />
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
import * as PlanApi from '@/api/oa/plan'
import { OA_PLAN_STATUS, OA_PLAN_TYPE } from '../../utils/constants'

defineOptions({ name: 'OaPlanForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('create') // 表单类型：create - 新增；update - 修改
const formData = ref<PlanApi.OaPlanVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '计划类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '计划状态不能为空', trigger: 'change' }],
  title: [
    { required: true, message: '计划标题不能为空', trigger: 'blur' },
    { max: 50, message: '计划标题不能超过 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '计划内容不能为空', trigger: 'blur' },
    { min: 20, message: '计划内容不能少于 20 个字符', trigger: 'blur' }
  ],
  summary: [
    {
      validator: (_rule, value, callback) => {
        if (!value || value.trim().length >= 20) {
          callback()
          return
        }
        callback(new Error('计划总结不能少于 20 个字符'))
      },
      trigger: 'blur'
    }
  ],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref

const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  // 修改时，加载工作计划详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await PlanApi.getPlan(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
async function submitForm() {
  // 1. 校验表单
  await formRef.value?.validate()
  // 2. 校验计划时间
  if (Number(formData.value.endTime) <= Number(formData.value.startTime)) {
    message.error('结束时间必须晚于开始时间')
    return
  }

  // 3. 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await PlanApi.createPlan(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await PlanApi.updatePlan(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 切换计划类型 */
function handlePlanTypeChange(type: number) {
  // 按日、周、月计划初始化周期，用户仍可手动调整起止时间
  const beginTime = dayjs().second(0).millisecond(0)
  const endTime =
    type === OA_PLAN_TYPE.DAY
      ? beginTime.add(1, 'day')
      : type === OA_PLAN_TYPE.WEEK
        ? beginTime.add(7, 'day')
        : beginTime.add(1, 'month')
  formData.value.startTime = beginTime.valueOf()
  formData.value.endTime = endTime.valueOf()
}

/** 重置表单 */
function resetForm() {
  formRef.value?.resetFields()
  formData.value = createDefaultFormData()
  handlePlanTypeChange(formData.value.type)
}

/** 创建工作计划默认表单数据 */
function createDefaultFormData(): PlanApi.OaPlanVO {
  return {
    type: OA_PLAN_TYPE.DAY,
    status: OA_PLAN_STATUS.UNFINISHED,
    title: '',
    label: '',
    content: '',
    summary: undefined,
    startTime: '',
    endTime: '',
    fileUrls: []
  }
}
</script>
