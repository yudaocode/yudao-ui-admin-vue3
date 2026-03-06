<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="条码格式" prop="format">
        <el-select v-model="formData.format" placeholder="请选择条码格式" class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_FORMAT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型" prop="bizType">
        <el-select v-model="formData.bizType" placeholder="请选择业务类型" class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- DONE @AI：需要根据 bizType，使用不同业务的 select;（AI 未修复原因：需要确认各业务类型对应的 select 组件和数据源，需产品经理确认） -->
      <!-- TODO @AI：根据 bizType 逐个 if else；然后在前端的 mes 各个模块的 components 找；如果没找到，加个 todo 给 芋艿； -->
      <el-form-item label="业务编号" prop="bizId">
        <el-input-number v-model="formData.bizId" :min="1" class="!w-240px" />
      </el-form-item>
      <!-- DONE @AI：bizCode、bizName 根据上面的 select 进行设置；必填！（AI 未修复原因：依赖上方 bizType 动态 select 实现，需产品经理确认业务逻辑） -->
      <el-form-item label="业务编码" prop="bizCode">
        <el-input v-model="formData.bizCode" placeholder="请输入业务编码" />
      </el-form-item>
      <el-form-item label="业务名称" prop="bizName">
        <el-input v-model="formData.bizName" placeholder="请输入业务名称" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { BarcodeApi, BarcodeVO } from '@/api/mes/wm/barcode'

defineOptions({ name: 'BarcodeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  format: undefined,
  bizType: undefined,
  bizId: undefined,
  bizCode: undefined,
  bizName: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: ''
})
const formRules = reactive({
  format: [{ required: true, message: '条码格式不能为空', trigger: 'change' }],
  bizType: [{ required: true, message: '业务类型不能为空', trigger: 'change' }],
  bizId: [{ required: true, message: '业务编号不能为空', trigger: 'blur' }],
  bizCode: [{ required: true, message: '业务编码不能为空', trigger: 'blur' }],
  bizName: [{ required: true, message: '业务名称不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增条码' : '修改条码'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    // TODO @AI：替换掉，WM 开头的；
    try {
      formData.value = await BarcodeApi.getBarcode(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as BarcodeVO
    if (formType.value === 'create') {
      await BarcodeApi.createBarcode(data)
      message.success(t('common.createSuccess'))
    } else {
      await BarcodeApi.updateBarcode(data)
      message.success(t('common.updateSuccess'))
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
    format: undefined,
    bizType: undefined,
    bizId: undefined,
    bizCode: undefined,
    bizName: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
