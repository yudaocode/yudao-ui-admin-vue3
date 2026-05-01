<!-- MES 质检方案表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <!-- 基本信息表单 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="方案编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入方案编号">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="方案名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入方案名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择" class="!w-1/1">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
          <el-form-item label="检测种类" prop="types">
            <el-select
              v-model="formData.types"
              multiple
              filterable
              placeholder="请选择检测种类"
              class="!w-1/1"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_TYPE)"
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
            <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 子表标签页（编辑模式下显示） -->
    <template v-if="formData.id">
      <el-divider />
      <el-tabs v-model="activeTab">
        <el-tab-pane label="检测指标项" name="indicator">
          <TemplateIndicatorList :template-id="formData.id" />
        </el-tab-pane>
        <el-tab-pane label="产品关联" name="item">
          <TemplateItemList :template-id="formData.id" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading" v-if="!isDetail">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { QcTemplateApi, QcTemplateVO } from '@/api/mes/qc/template'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import { MesAutoCodeRuleCode } from '@/views/mes/utils/constants'
import TemplateIndicatorList from './TemplateIndicatorList.vue'
import TemplateItemList from './TemplateItemList.vue'

defineOptions({ name: 'TemplateForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const activeTab = ref('indicator') // 子表当前激活的 Tab
const formData = ref({
  id: undefined as number | undefined,
  code: undefined,
  name: undefined,
  types: [] as number[],
  status: CommonStatusEnum.ENABLE,
  remark: undefined
})
const formRules = reactive<FormRules>({
  code: [{ required: true, message: '方案编号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  types: [
    { required: true, message: '检测种类不能为空', trigger: 'change', type: 'array', min: 1 }
  ],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const isDetail = computed(() => formType.value === 'detail') // 表单是否为详情模式（只读）

/** 生成方案编号 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.QC_TEMPLATE_CODE
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  activeTab.value = 'indicator'
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await QcTemplateApi.getTemplate(id)
      formData.value = {
        ...data,
        types: data.types
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcTemplateVO
    if (formType.value === 'create') {
      await QcTemplateApi.createTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateApi.updateTemplate(data)
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
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    types: [],
    status: CommonStatusEnum.ENABLE,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
