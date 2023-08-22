<template>
  <Dialog v-model="dialogVisible" title="修改订单收货地址" width="35%">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" label-width="120px">
      <el-form-item label="收件人名称">
        <el-input v-model="formData.receiverName" />
      </el-form-item>
      <el-form-item label="收件人手机">
        <el-input v-model="formData.receiverMobile" />
      </el-form-item>
      <el-form-item label="收件人地区编号">
        <el-input v-model="formData.receiverAreaId" />
      </el-form-item>
      <el-form-item label="收件人详细地址">
        <el-input v-model="formData.receiverDetailAddress" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as TradeOrderApi from '@/api/mall/trade/order'
import { copyValueToTarget } from '@/utils'

defineOptions({ name: 'OrderAdjustAddressForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: 0, // 订单编号
  receiverName: '', // 收件人名称
  receiverMobile: '', // 收件人手机
  receiverAreaId: null, //收件人地区编号
  receiverDetailAddress: '' //收件人详细地址
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (row: TradeOrderApi.OrderVO) => {
  resetForm()
  // 设置数据
  copyValueToTarget(formData.value, row)
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 提交请求
  formLoading.value = true
  try {
    const data = unref(formData)
    await TradeOrderApi.adjustAddress(data)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success', true)
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: 0, // 订单编号
    receiverName: '', // 收件人名称
    receiverMobile: '', // 收件人手机
    receiverAreaId: null, //收件人地区编号
    receiverDetailAddress: '' //收件人详细地址
  }
  formRef.value?.resetFields()
}
</script>
