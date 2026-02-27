<!-- MES 领料出库拣货明细表单弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="物料" prop="itemId">
        <MdItemSelect v-model="formData.itemId" disabled />
      </el-form-item>
      <el-form-item label="出库仓库" prop="warehouseId">
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
      <el-form-item label="批次号" prop="batchCode">
        <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
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
  WmProductionIssueDetailApi,
  WmProductionIssueDetailVO
} from '@/api/mes/wm/productionissue/detail'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'ProductionIssueDetailForm' })

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
  batchCode: undefined as string | undefined,
  warehouseId: undefined as number | undefined,
  locationId: undefined as number | undefined,
  areaId: undefined as number | undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  warehouseId: [{ required: true, message: '出库仓库不能为空', trigger: 'change' }],
  locationId: [{ required: true, message: '库区不能为空', trigger: 'change' }],
  areaId: [{ required: true, message: '库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

/** 打开弹窗 */
const open = async (type: string, lineId: number, itemId?: number, detailId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加拣货明细' : '编辑拣货明细'
  formType.value = type
  currentLineId.value = lineId
  resetForm()
  // 修改时，设置数据
  if (detailId) {
    formLoading.value = true
    try {
      formData.value = await WmProductionIssueDetailApi.getProductionIssueDetail(detailId)
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
    } as unknown as WmProductionIssueDetailVO
    if (formType.value === 'create') {
      await WmProductionIssueDetailApi.createProductionIssueDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmProductionIssueDetailApi.updateProductionIssueDetail(data)
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
    batchCode: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined
  }
  formRef.value?.resetFields()
}
</script>
