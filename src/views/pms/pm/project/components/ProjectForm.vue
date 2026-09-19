<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <!-- 项目基本信息 -->
      <el-form-item v-if="formType === 'create'" label="项目类型" prop="type">
        <div class="w-100%">
          <el-radio-group v-model="formData.type">
            <el-radio-button :value="PmsProjectType.GENERAL">通用项目</el-radio-button>
            <el-radio-button :value="PmsProjectType.AGILE">敏捷开发项目</el-radio-button>
          </el-radio-group>
          <div class="mt-8px text-13px text-[var(--el-text-color-secondary)]">
            {{ projectTypeTip }}
          </div>
        </div>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="项目名称" prop="name">
            <el-input
              v-model="formData.name"
              clearable
              maxlength="31"
              placeholder="请输入项目名称"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="项目封面" prop="icon">
            <IconSelect v-model="formData.icon" class="!w-100%" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 项目周期 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              class="!w-100%"
              placeholder="请选择开始时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="截止时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              class="!w-100%"
              placeholder="请选择截止时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="项目描述" prop="description">
        <el-input
          v-model="formData.description"
          :rows="3"
          maxlength="500"
          placeholder="请输入项目描述"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <!-- 项目权限 -->
      <el-form-item label="可见范围" prop="openStatus">
        <el-radio-group v-model="formData.openStatus">
          <el-radio :value="false">私有：只有项目成员可以查看</el-radio>
          <el-radio :value="true">公开：所有人可查看，只有项目成员可以编辑</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formType === 'create' && !formData.openStatus"
        label="项目成员"
        prop="memberUserIds"
      >
        <UserSelectV2
          v-model="formData.memberUserIds"
          :multiple="true"
          placeholder="请选择项目成员；创建人会自动加入"
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
import * as ProjectApi from '@/api/pms/pm/project'
import { PmsProjectLevel, PmsProjectType } from '@/views/pms/pm/utils/constants'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'PmsProjectForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<Partial<ProjectApi.PmsProjectVO>>(getDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请选择项目封面', trigger: 'change' }],
  openStatus: [{ required: true, message: '请选择项目可见范围', trigger: 'change' }],
  startTime: [{ validator: validateProjectTimeRange, trigger: 'change' }],
  endTime: [{ validator: validateProjectTimeRange, trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
const projectTypeTip = computed(() =>
  formData.value.type === PmsProjectType.AGILE
    ? '适合敏捷研发协作，提供需求、迭代、任务、缺陷和甘特图。'
    : '适合日常任务协作，提供项目概况、任务和甘特图。'
) // 当前项目类型说明

/** 校验项目时间范围 */
function validateProjectTimeRange(
  _rule: unknown,
  _value: unknown,
  callback: (error?: Error) => void
) {
  if (
    formData.value.startTime &&
    formData.value.endTime &&
    Number(formData.value.startTime) >= Number(formData.value.endTime)
  ) {
    callback(new Error('开始时间必须早于截止时间'))
    return
  }
  callback()
}

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时加载项目详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProjectApi.getProject(id)
    } finally {
      formLoading.value = false
    }
  }
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
    if (formType.value === 'create') {
      await ProjectApi.createProject(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ProjectApi.updateProject(formData.value)
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
  formData.value = getDefaultFormData()
  formRef.value?.resetFields()
}

/** 获得默认表单数据 */
function getDefaultFormData(): Partial<ProjectApi.PmsProjectVO> {
  return {
    id: undefined,
    name: '',
    type: PmsProjectType.GENERAL,
    level: PmsProjectLevel.NORMAL,
    description: '',
    openStatus: false,
    icon: 'ep:folder',
    startTime: undefined,
    endTime: undefined,
    memberUserIds: []
  }
}
</script>
