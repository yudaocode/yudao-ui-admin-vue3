<template>
  <el-dialog :title="'生成 SN 码'" v-model="dialogVisible" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="物料" prop="itemId">
        <MdItemSelect v-model="formData.itemId" />
      </el-form-item>
      <el-form-item label="批次号" prop="batchCode">
        <el-input v-model="formData.batchCode" placeholder="请输入批次号" maxlength="100" />
      </el-form-item>
      <el-form-item label="生成数量" prop="count">
        <el-input-number v-model="formData.count" :min="1" :max="1000" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import * as WmSnApi from '@/api/mes/wm/sn'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

defineOptions({ name: 'WmSnGenerateForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
const formData = ref<WmSnApi.WmSnGenerateVO>({ // 表单数据
  itemId: undefined,
  batchCode: undefined,
  workOrderId: undefined,
  count: 100
})
const formRules = reactive({ // 表单校验
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  count: [{ required: true, message: '生成数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
  resetForm()
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    itemId: undefined,
    batchCode: undefined,
    workOrderId: undefined,
    count: 100
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await WmSnApi.generateSnCodes(formData.value)
    message.success('生成成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 暴露给父组件的方法 */
defineExpose({ open })

const emit = defineEmits(['success'])
</script>
