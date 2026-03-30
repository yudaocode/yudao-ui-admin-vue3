<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="出库单编号" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="请输入出库单编号"
              :disabled="isHeaderReadonly"
            >
              <template #append>
                <el-button @click="generateCode" :disabled="isHeaderReadonly"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="出库单名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入出库单名称"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="业务类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择业务类型"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            >
              <el-option
                v-for="dict in getStrDictOptions(DICT_TYPE.MES_WM_MISC_ISSUE_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="出库日期" prop="issueDate">
            <el-date-picker
              v-model="formData.issueDate"
              type="date"
              value-format="x"
              placeholder="请选择出库日期"
              class="!w-1/1"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="来源单据编号" prop="sourceDocCode">
            <el-input
              v-model="formData.sourceDocCode"
              placeholder="请输入来源单据编号"
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="来源单据类型" prop="sourceDocType">
            <el-input
              v-model="formData.sourceDocType"
              placeholder="请输入来源单据类型"
              :disabled="isHeaderReadonly"
            />
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
              :disabled="isHeaderReadonly"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 非新建模式展示物料信息 -->
    <template v-if="formData.id">
      <el-divider content-position="center">物料信息</el-divider>
      <MiscIssueLineList :issue-id="formData.id" :form-type="formType" />
    </template>
    <template #footer>
      <el-button v-if="isEditable" @click="submitForm" type="primary" :disabled="formLoading">
        保 存
      </el-button>
      <el-button
        v-if="isEditable && formData.id && formData.status === MesWmMiscIssueStatusEnum.PREPARE"
        @click="handleSubmit"
        type="warning"
        :disabled="formLoading"
      >
        提 交
      </el-button>
      <el-button v-if="isFinish" @click="handleFinish" type="success" :disabled="formLoading">
        执行出库
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { WmMiscIssueApi, WmMiscIssueVO } from '@/api/mes/wm/miscissue'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import MiscIssueLineList from './MiscIssueLineList.vue'
import { MesAutoCodeRuleCode, MesWmMiscIssueStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MiscIssueForm' })
const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formType = ref<string>('create') // 表单的类型：create / update / finish / detail
const isEditable = computed(() => ['create', 'update'].includes(formType.value)) // 是否为编辑模式
const isFinish = computed(() => formType.value === 'finish') // 是否为执行出库模式
const isDetail = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否为详情模式
const isHeaderReadonly = computed(() => ['detail', 'finish'].includes(formType.value)) // 是否只读
const dialogTitle = computed(() => {
  const titles = {
    create: '新增杂项出库单',
    update: '编辑杂项出库单',
    finish: '执行出库',
    detail: '杂项出库单详情'
  }
  return titles[formType.value] || formType.value
})
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  status: undefined as number | undefined,
  issueDate: undefined,
  sourceDocCode: undefined,
  sourceDocType: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '出库单编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '出库单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '业务类型不能为空', trigger: 'change' }],
  issueDate: [{ required: true, message: '出库日期不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const originalFormData = ref<string>('') // 原始表单数据快照，用于脏检查

/** 生成出库单编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_MISC_ISSUE_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 修改/执行出库/详情时，加载数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmMiscIssueApi.getMiscIssue(id)
    } finally {
      formLoading.value = false
    }
  }
  // 保存原始数据快照
  originalFormData.value = JSON.stringify(formData.value)
}

/** 保存表单（create/update 模式） */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmMiscIssueVO
    if (formType.value === 'create') {
      const res = await WmMiscIssueApi.createMiscIssue(data)
      message.success('新增成功')
      formData.value.id = res
      formData.value.status = MesWmMiscIssueStatusEnum.PREPARE
      formType.value = 'update'
    } else {
      await WmMiscIssueApi.updateMiscIssue(data)
      message.success('修改成功')
    }
    // 更新快照
    originalFormData.value = JSON.stringify(formData.value)
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 提交操作：编辑模式下表单修改过则先保存，再提交 */
const handleSubmit = async () => {
  if (isEditable.value) {
    await formRef.value.validate()
  }
  try {
    await message.confirm('确认提交该杂项出库单？【提交后将不能修改】')
    formLoading.value = true
    // 编辑模式下，表单有修改时先保存
    if (isEditable.value && JSON.stringify(formData.value) !== originalFormData.value) {
      const data = formData.value as unknown as WmMiscIssueVO
      await WmMiscIssueApi.updateMiscIssue(data)
    }
    await WmMiscIssueApi.submitMiscIssue(formData.value.id!)
    message.success('提交成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 执行出库 */
const handleFinish = async () => {
  try {
    await message.confirm('确认执行出库？执行后将更新库存台账。')
    formLoading.value = true
    await WmMiscIssueApi.finishMiscIssue(formData.value.id!)
    message.success('出库成功')
    dialogVisible.value = false
    emit('success')
  } catch {
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
    type: undefined,
    status: undefined,
    issueDate: undefined,
    sourceDocCode: undefined,
    sourceDocType: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

defineExpose({ open })
</script>
