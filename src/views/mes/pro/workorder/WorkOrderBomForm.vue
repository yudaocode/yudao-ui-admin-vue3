<!-- MES 生产工单 BOM 表单弹窗 -->
<!-- TODO @AI：参考别的模块，应该融合到 List 里； -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="物料" prop="itemId">
        <MdItemSelect v-model="formData.itemId" @change="handleItemChange" />
      </el-form-item>
      <el-form-item label="单位" prop="unitMeasureId">
        <MdUnitMeasureSelect v-model="formData.unitMeasureId" />
      </el-form-item>
      <el-form-item label="预计使用量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :min="0"
          :precision="2"
          class="!w-1/1"
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
import { ProWorkOrderBomApi, ProWorkOrderBomVO } from '@/api/mes/pro/workorder/bom'
import { MdItemVO } from '@/api/mes/md/item'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdUnitMeasureSelect from '@/views/mes/md/unitmeasure/components/MdUnitMeasureSelect.vue'

defineOptions({ name: 'WorkOrderBomForm' })

const props = defineProps<{
  workOrderId: number
}>()

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  workOrderId: undefined as number | undefined,
  itemId: undefined,
  unitMeasureId: undefined,
  quantity: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  unitMeasureId: [{ required: true, message: '单位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '预计使用量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, row?: any) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加物料' : '编辑物料'
  formType.value = type
  // 重置表单
  formData.value = {
    id: undefined,
    workOrderId: props.workOrderId,
    itemId: undefined,
    unitMeasureId: undefined,
    quantity: undefined,
    remark: undefined
  }
  // 编辑时设置数据
  if (row) {
    formData.value = { ...row }
  }
}
defineExpose({ open })

/** 物料变更：自动填充单位 */
const handleItemChange = (item: MdItemVO | undefined) => {
  if (item?.unitMeasureId) {
    formData.value.unitMeasureId = item.unitMeasureId
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProWorkOrderBomVO
    if (formType.value === 'create') {
      await ProWorkOrderBomApi.createWorkOrderBom(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProWorkOrderBomApi.updateWorkOrderBom(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
