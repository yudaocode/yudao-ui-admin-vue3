<!-- MES 质检指标表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="检测项编码" prop="code">
        <el-input v-model="formData.code" placeholder="请输入检测项编码">
          <template #append>
            <el-button @click="generateCode"> 生成 </el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="检测项名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入检测项名称" />
      </el-form-item>
      <el-form-item label="检测项类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择检测项类型" clearable class="!w-1/1">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.MES_INDICATOR_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="检测工具" prop="tool">
        <el-input v-model="formData.tool" placeholder="请输入检测工具" />
      </el-form-item>
      <el-form-item label="结果值类型" prop="resultType">
        <el-select
          v-model="formData.resultType"
          placeholder="请选择结果值类型"
          clearable
          class="!w-1/1"
          @change="handleResultTypeChange"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_RESULT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- 动态显示：FILE 类型 -->
      <el-form-item
        v-if="formData.resultType === MesQcResultValueType.FILE"
        label="文件类型"
        prop="resultSpecification"
      >
        <el-radio-group v-model="formData.resultSpecification">
          <el-radio label="IMG">图片/照片</el-radio>
          <el-radio label="FILE">文件</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- 动态显示：DICT 类型 -->
      <el-form-item
        v-else-if="formData.resultType === MesQcResultValueType.DICT"
        label="字典类型"
        prop="resultSpecification"
      >
        <el-input
          v-model="formData.resultSpecification"
          placeholder="请输入字典类型名（如 sys_yes_no）"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getStrDictOptions, getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { QcIndicatorApi, QcIndicatorVO } from '@/api/mes/qc/indicator'
import { generateRandomStr } from '@/utils'
import { MesQcResultValueType } from '@/views/mes/utils/constants'

defineOptions({ name: 'IndicatorForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  type: undefined,
  tool: undefined,
  resultType: undefined,
  resultSpecification: undefined,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '检测项编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '检测项名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '检测项类型不能为空', trigger: 'change' }],
  resultType: [{ required: true, message: '结果值类型不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 生成检测项编码 */
const generateCode = () => {
  // TODO @芋艿：后续对接后端编码生成接口
  formData.value.code = 'QI' + generateRandomStr(12)
}

/** 结果值类型变更时清空结果值属性 */
const handleResultTypeChange = () => {
  formData.value.resultSpecification = undefined
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcIndicatorApi.getIndicator(id)
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
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcIndicatorVO
    if (formType.value === 'create') {
      await QcIndicatorApi.createIndicator(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcIndicatorApi.updateIndicator(data)
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
    type: undefined,
    tool: undefined,
    resultType: undefined,
    resultSpecification: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
