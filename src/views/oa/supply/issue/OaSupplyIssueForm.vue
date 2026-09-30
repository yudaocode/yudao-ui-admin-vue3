<template>
  <Dialog v-model="dialogVisible" :title="'发放 - ' + (item.itemName || '')" width="550px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="物品名称">
        <el-input :model-value="item.itemName" disabled />
      </el-form-item>
      <el-form-item label="申请数量">
        <el-input-number :model-value="item.applyQuantity" disabled class="!w-full" />
      </el-form-item>
      <el-form-item label="实发数量" prop="issuedQuantity">
        <el-input-number
          v-model="formData.issuedQuantity"
          placeholder="请输入实发数量"
          :min="1"
          :precision="0"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="发放备注" prop="issueRemark">
        <el-input
          v-model="formData.issueRemark"
          placeholder="请输入发放备注"
          type="textarea"
          :rows="3"
          maxlength="500"
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
import * as SupplyIssueApi from '@/api/oa/supply/issue'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'OaSupplyIssueForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const formLoading = ref(false) // 表单提交中，禁用提交按钮
const item = ref<SupplyIssueApi.SupplyApplyItemVO>({}) // 申请明细
const formData = ref<SupplyIssueApi.SupplyApplyItemVO>({}) // 表单数据
const formRules = reactive<FormRules>({
  issuedQuantity: [{ required: true, message: '实发数量不能为空', trigger: 'blur' }]
}) // 表单校验
const formRef = ref() // 表单引用

/** 打开弹窗 */
function open(row: SupplyIssueApi.SupplyApplyItemVO) {
  dialogVisible.value = true
  resetForm()
  // 设置当前发放明细，默认按申请数量发放
  item.value = row
  formData.value.id = row.id
  formData.value.issuedQuantity = row.applyQuantity
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await SupplyIssueApi.issueSupplyApplyItem(formData.value)
    message.success('发放成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  item.value = {}
  formData.value = {
    id: undefined,
    issuedQuantity: undefined,
    issueRemark: ''
  }
  formRef.value?.resetFields()
}
</script>
