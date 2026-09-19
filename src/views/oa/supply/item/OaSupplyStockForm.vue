<template>
  <Dialog v-model="dialogVisible" :title="'入库 - ' + (item.name || '')" width="550px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="物品名称"><el-input :model-value="item.name" disabled /></el-form-item>
      <el-form-item label="当前库存">
        <el-input-number :model-value="item.stockQuantity" disabled class="!w-full" />
      </el-form-item>
      <el-form-item label="入库数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          placeholder="请输入入库数量"
          :min="1"
          :precision="0"
          class="!w-full"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as SupplyItemApi from '@/api/oa/supply/item'

defineOptions({ name: 'OaSupplyStockForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const formLoading = ref(false) // 表单加载中
const item = ref<SupplyItemApi.SupplyItemVO>({}) // 入库物品
const formData = ref({ quantity: undefined as number | undefined }) // 表单数据
const formRules = reactive({
  quantity: [{ required: true, message: '入库数量不能为空', trigger: 'blur' }]
}) // 表单校验
const formRef = ref() // 表单引用

/** 打开弹窗 */
function open(row: SupplyItemApi.SupplyItemVO) {
  item.value = row
  formData.value = { quantity: undefined }
  formRef.value?.resetFields()
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const emit = defineEmits(['success']) // 操作成功

/** 提交表单 */
async function submitForm() {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await SupplyItemApi.stockInSupplyItem(item.value.id!, formData.value.quantity!)
    message.success('入库成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
