<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="92px"
    >
      <!-- 迭代基本信息 -->
      <el-form-item label="迭代名称" prop="name">
        <el-input v-model="formData.name" maxlength="100" placeholder="请输入迭代名称" />
      </el-form-item>
      <!-- 迭代周期 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              class="!w-100%"
              clearable
              placeholder="请选择开始时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              class="!w-100%"
              clearable
              placeholder="请选择结束时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="迭代目标" prop="target">
        <el-input v-model="formData.target" maxlength="255" placeholder="请输入迭代目标" />
      </el-form-item>
      <el-form-item label="负责人" prop="ownerUserId">
        <el-select
          v-model="formData.ownerUserId"
          class="!w-100%"
          clearable
          filterable
          placeholder="请选择项目成员"
        >
          <el-option
            v-for="member in memberList"
            :key="member.userId"
            :label="member.nickname"
            :value="member.userId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="迭代描述" prop="description">
        <el-input
          v-model="formData.description"
          :rows="4"
          maxlength="2000"
          placeholder="请输入迭代描述"
          show-word-limit
          type="textarea"
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
import * as ProjectMemberApi from '@/api/pms/pm/project/member'

defineOptions({ name: 'PmsIterationForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单提交中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const projectId = ref(0) // 项目编号
const memberList = ref<ProjectMemberApi.PmsProjectMemberVO[]>([]) // 项目成员列表
const formData = ref<IterationApi.PmsIterationVO>(getDefaultFormData()) // 表单数据
const formRules = reactive({
  name: [{ required: true, message: '迭代名称不能为空', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(type: string, currentProjectId: number, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新建迭代' : '编辑迭代'
  formType.value = type
  projectId.value = currentProjectId
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await IterationApi.getIteration(id)
    } finally {
      formLoading.value = false
    }
  }
  memberList.value = await ProjectMemberApi.getProjectMemberList(currentProjectId)
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  if (
    formData.value.startTime &&
    formData.value.endTime &&
    Number(formData.value.startTime) >= Number(formData.value.endTime)
  ) {
    message.warning('迭代开始时间必须早于结束时间')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await IterationApi.createIteration(formData.value)
      message.success('创建成功')
    } else {
      await IterationApi.updateIteration(formData.value)
      message.success('更新成功')
    }
    dialogVisible.value = false
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
function getDefaultFormData(): IterationApi.PmsIterationVO {
  return {
    projectId: projectId.value,
    name: ''
  }
}
</script>
