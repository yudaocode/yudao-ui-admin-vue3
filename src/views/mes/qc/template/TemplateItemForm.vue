<!-- MES 质检方案-产品关联 表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="150px"
      v-loading="formLoading"
    >
      <el-form-item label="产品物料" prop="itemId">
        <MdItemSelect v-model="formData.itemId" placeholder="请选择产品物料" />
      </el-form-item>
      <el-form-item label="最低检测数" prop="quantityCheck">
        <el-input-number
          v-model="formData.quantityCheck"
          placeholder="请输入最低检测数"
          :min="1"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="最大不合格数" prop="quantityUnqualified">
        <el-input-number
          v-model="formData.quantityUnqualified"
          placeholder="0表示不启用"
          :min="0"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="最大致命缺陷率(%)" prop="criticalRate">
        <el-input-number
          v-model="formData.criticalRate"
          placeholder="0表示不允许"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="最大严重缺陷率(%)" prop="majorRate">
        <el-input-number
          v-model="formData.majorRate"
          placeholder="0表示不允许"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item label="最大轻微缺陷率(%)" prop="minorRate">
        <el-input-number
          v-model="formData.minorRate"
          :min="0"
          :max="100"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
// TODO @AI：整个文件的注释风格，参考 user 的 form.vue 那；
import { QcTemplateItemApi, QcTemplateItemVO } from '@/api/mes/qc/template/item'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'TemplateItemForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  templateId: undefined as number | undefined,
  itemId: undefined,
  quantityCheck: 1,
  quantityUnqualified: 0,
  criticalRate: 0,
  majorRate: 0,
  minorRate: 100
})
const formRules = reactive({
  itemId: [{ required: true, message: '产品物料不能为空', trigger: 'change' }],
  quantityCheck: [{ required: true, message: '最低检测数不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number, templateId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.templateId = templateId
  if (id) {
    formLoading.value = true
    try {
      formData.value = await QcTemplateItemApi.getTemplateItem(id)
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
    const data = formData.value as unknown as QcTemplateItemVO
    if (formType.value === 'create') {
      await QcTemplateItemApi.createTemplateItem(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcTemplateItemApi.updateTemplateItem(data)
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
    templateId: undefined,
    itemId: undefined,
    quantityCheck: 1,
    quantityUnqualified: 0,
    criticalRate: 0,
    majorRate: 0,
    minorRate: 100
  }
  formRef.value?.resetFields()
}
</script>
