<!-- MES 检验结果表单弹窗（含动态检测值输入） -->
<!-- TODO @AI：这个文件名，可以更全面一点；另外，放到 components 目录下； -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" v-loading="formLoading">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="样品编号" prop="code">
            <el-input v-model="formData.code" placeholder="请输入样品编号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物资SN" prop="sn">
            <el-input v-model="formData.sn" placeholder="请输入物资SN" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 检测值列表 -->
      <el-divider content-position="left">检测值</el-divider>
      <div v-for="(item, index) in formData.items" :key="index">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="'检测项' + (index + 1)">
              <el-input :model-value="item.indicatorName" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- 浮点值 -->
            <el-form-item v-if="item.valueType === 1" label="检测值">
              <el-input-number v-model="item.valueFloat" :precision="4" placeholder="请输入" class="!w-1/1" />
            </el-form-item>
            <!-- 整数值 -->
            <el-form-item v-else-if="item.valueType === 2" label="检测值">
              <el-input-number v-model="item.valueInteger" :precision="0" placeholder="请输入" class="!w-1/1" />
            </el-form-item>
            <!-- 文本值 -->
            <el-form-item v-else-if="item.valueType === 3" label="检测值">
              <el-input v-model="item.valueText" type="textarea" placeholder="请输入检测值" />
            </el-form-item>
            <!-- 字典值 -->
            <el-form-item v-else-if="item.valueType === 4" label="检测值">
              <el-select v-model="item.valueDict" placeholder="请选择" class="!w-1/1">
                <el-option
                  v-for="dict in getDictOptions(item.valueSpecification)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <!-- 文件值 -->
            <el-form-item v-else-if="item.valueType === 5" label="检测值">
              <el-input v-model="item.valueFile" placeholder="请输入文件地址" />
            </el-form-item>
            <!-- 未知类型 -->
            <el-form-item v-else label="检测值">
              <el-input v-model="item.valueText" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider v-if="index < formData.items.length - 1" />
      </div>
    </el-form>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { QcResultApi } from '@/api/mes/qc/indicatorresult'
import { getDictOptions } from '@/utils/dict'

defineOptions({ name: 'ResultForm' })

const props = defineProps<{
  qcId: number
  qcType: number
}>()

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')

const formData = ref({
  id: undefined as number | undefined,
  code: undefined as string | undefined,
  qcId: undefined as number | undefined,
  qcType: undefined as number | undefined,
  sn: undefined as string | undefined,
  remark: undefined as string | undefined,
  items: [] as any[]
})
const formRules = reactive({
  code: [{ required: true, message: '样品编号不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.qcId = props.qcId
  formData.value.qcType = props.qcType

  if (type === 'update' && id) {
    // 修改时加载已有数据（含明细）
    formLoading.value = true
    try {
      const data = await QcResultApi.getResult(id)
      formData.value = data
    } finally {
      formLoading.value = false
    }
  } else {
    // 新增时加载空值检测项模板
    formLoading.value = true
    try {
      formData.value.items = await QcResultApi.getDetailTemplate(props.qcId, props.qcType)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (formType.value === 'create') {
      await QcResultApi.createResult(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcResultApi.updateResult(data)
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
    code: undefined,
    qcId: undefined,
    qcType: undefined,
    sn: undefined,
    remark: undefined,
    items: []
  }
  formRef.value?.resetFields()
}
</script>
