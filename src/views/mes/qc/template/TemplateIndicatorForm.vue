<!-- MES 质检方案-检测指标项 表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="质检指标" prop="indicatorId">
            <QcIndicatorSelect
              v-model="formData.indicatorId"
              placeholder="请选择质检指标"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标准值" prop="standardValue">
            <el-input-number
              v-model="formData.standardValue"
              placeholder="请输入标准值"
              :precision="4"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="计量单位" prop="unitMeasureId">
            <MdUnitMeasureSelect
              v-model="formData.unitMeasureId"
              placeholder="请选择计量单位"
              clearable
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="误差上限" prop="thresholdMax">
            <el-input-number
              v-model="formData.thresholdMax"
              placeholder="请输入"
              :precision="4"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="误差下限" prop="thresholdMin">
            <el-input-number
              v-model="formData.thresholdMin"
              placeholder="请输入"
              :precision="4"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="检测方法" prop="checkMethod">
            <el-input
              type="textarea"
              v-model="formData.checkMethod"
              placeholder="请输入检测方法"
              :rows="3"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="说明图URL" prop="docUrl">
            <el-input v-model="formData.docUrl" placeholder="请输入说明图URL" />
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
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcTemplateIndicatorApi, QcTemplateIndicatorVO } from '@/api/mes/qc/template/indicator'
import QcIndicatorSelect from '@/views/mes/qc/indicator/components/QcIndicatorSelect.vue'
import MdUnitMeasureSelect from '@/views/mes/md/unitmeasure/components/MdUnitMeasureSelect.vue'

defineOptions({ name: 'TemplateIndicatorForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  templateId: undefined as number | undefined,
  indicatorId: undefined,
  checkMethod: undefined,
  standardValue: undefined,
  unitMeasureId: undefined,
  thresholdMax: undefined,
  thresholdMin: undefined,
  docUrl: undefined,
  remark: undefined
})
const formRules = reactive({
  indicatorId: [{ required: true, message: '质检指标不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number, templateId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.templateId = templateId
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcTemplateIndicatorApi.getTemplateIndicator(id)
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
    const data = formData.value as unknown as QcTemplateIndicatorVO
    if (formType.value === 'create') {
      await QcTemplateIndicatorApi.createTemplateIndicator(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateIndicatorApi.updateTemplateIndicator(data)
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
    templateId: undefined,
    indicatorId: undefined,
    checkMethod: undefined,
    standardValue: undefined,
    unitMeasureId: undefined,
    thresholdMax: undefined,
    thresholdMin: undefined,
    docUrl: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
