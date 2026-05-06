<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="班组编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入班组编码" :maxlength="64">
              <template #append>
                <el-button @click="generateCode">生成</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="班组名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入班组名称" :maxlength="100" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="班组类型" prop="calendarType">
            <el-select v-model="formData.calendarType" placeholder="请选择班组类型" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="请输入备注"
              :maxlength="250"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 编辑/查看时显示成员管理 Tab -->
    <el-tabs v-if="formType === 'update' || isDetail" v-model="activeTab" class="mt-10px">
      <el-tab-pane label="班组成员" name="member">
        <CalTeamMemberList :team-id="formData.id!" :form-type="formType" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import CalTeamMemberList from './CalTeamMemberList.vue'

defineOptions({ name: 'CalTeamForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const activeTab = ref('member') // 当前激活的资源 Tab
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增班组',
    update: '编辑班组',
    detail: '班组详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  calendarType: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [
    { required: true, message: '班组编码不能为空', trigger: 'blur' },
    { max: 64, message: '班组编码不能超过 64 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '班组名称不能为空', trigger: 'blur' },
    { max: 100, message: '班组名称不能超过 100 个字符', trigger: 'blur' }
  ],
  calendarType: [{ required: true, message: '班组类型不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 生成班组编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(MesAutoCodeRuleCode.CAL_TEAM_CODE)
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/详情时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await CalTeamApi.getTeam(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as CalTeamVO
    if (formType.value === 'create') {
      await CalTeamApi.createTeam(data)
      message.success('新增成功')
    } else {
      await CalTeamApi.updateTeam(data)
      message.success('修改成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    calendarType: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
