<template>
  <Dialog v-model="dialogVisible" title="修改订单收货地址" width="35%">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" label-width="120px">
      <el-form-item label="收件人">
        <el-input v-model="formData.receiverName" placeholder="请输入收件人名称" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="formData.receiverMobile" placeholder="请输入收件人手机号" />
      </el-form-item>
      <el-form-item label="所在地">
        <el-tree-select
          v-model="formData.receiverAreaId"
          :data="areaList"
          :props="defaultProps"
          :render-after-expand="true"
        />
      </el-form-item>
      <el-form-item label="详细地址">
        <el-input
          v-model="formData.receiverDetailAddress"
          :rows="3"
          placeholder="请输入收件人详细地址"
          type="textarea"
        />
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
import { getAreaTree } from '@/api/system/area'
import { copyValueToTarget } from '@/utils'
import { defaultProps } from '@/utils/tree'

defineOptions({ name: 'OrderUpdateAddressForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined, // 订单编号
  receiverName: '', // 收件人名称
  receiverMobile: '', // 收件人手机
  receiverAreaId: null, //收件人地区编号
  receiverDetailAddress: '' //收件人详细地址
})
const areaList = ref([]) // 地区列表
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
    await TradeOrderApi.updateOrderAddress(data)
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
    id: undefined, // 订单编号
    receiverName: '', // 收件人名称
    receiverMobile: '', // 收件人手机
    receiverAreaId: null, //收件人地区编号
    receiverDetailAddress: '' //收件人详细地址
  }
  formRef.value?.resetFields()
}

onMounted(async () => {
  // 获得地区列表
  areaList.value = await getAreaTree()
})
</script>
