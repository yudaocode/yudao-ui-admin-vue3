<!-- MES 外协发料单明细表单弹窗 -->
<!-- TODO @芋艿：未 review -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="物料" prop="itemId" required>
        <MdItemSelect v-model="formData.itemId" disabled />
      </el-form-item>
      <el-form-item label="发料仓库" prop="warehouseId" required>
        <WmWarehouseSelect v-model="formData.warehouseId" />
      </el-form-item>
      <el-form-item label="库区" prop="locationId" v-if="formData.warehouseId">
        <WmWarehouseLocationSelect
          v-model="formData.locationId"
          :warehouse-id="formData.warehouseId"
        />
      </el-form-item>
      <el-form-item label="库位" prop="areaId" v-if="formData.locationId">
        <WmWarehouseAreaSelect v-model="formData.areaId" :location-id="formData.locationId" />
      </el-form-item>
      <el-form-item label="数量" prop="quantity" required>
        <el-input-number
          v-model="formData.quantity"
          :precision="2"
          :min="0"
          controls-position="right"
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
import {
  WmOutsourceIssueDetailApi,
  WmOutsourceIssueDetailVO
} from '@/api/mes/wm/outsourceissue/detail'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'OutsourceIssueDetailForm' })

const props = defineProps<{
  issueId: number
}>()

const emit = defineEmits(['success'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create / update
const currentLineId = ref<number>() // 当前操作的行 ID
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  lineId: undefined as number | undefined,
  issueId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  quantity: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  locationId: undefined as number | undefined,
  areaId: undefined as number | undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  warehouseId: [{ required: true, message: '发料仓库不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

/** 打开弹窗 */
const open = async (type: string, lineId: number, itemId?: number, detailId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加发料明细' : '编辑发料明细'
  formType.value = type
  currentLineId.value = lineId
  resetForm()
  // 修改时，设置数据
  if (detailId) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceIssueDetailApi.getOutsourceIssueDetail(detailId)
    } finally {
      formLoading.value = false
    }
  } else if (itemId) {
    formData.value.itemId = itemId
  }
}
defineExpose({ open })

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      issueId: props.issueId,
      lineId: currentLineId.value
    } as unknown as WmOutsourceIssueDetailVO
    if (formType.value === 'create') {
      await WmOutsourceIssueDetailApi.createOutsourceIssueDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmOutsourceIssueDetailApi.updateOutsourceIssueDetail(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success', currentLineId.value)
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    lineId: undefined,
    issueId: undefined,
    itemId: undefined,
    quantity: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined
  }
  formRef.value?.resetFields()
}
</script>
