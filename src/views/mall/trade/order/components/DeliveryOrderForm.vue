<template>
  <Dialog v-model="dialogVisible" title="订单发货" width="25%">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" label-width="80px">
      <el-form-item label="发货方式">
        <el-radio-group v-model="radio">
          <el-radio border label="1">快递物流</el-radio>
          <el-radio border label="2">无需发货</el-radio>
        </el-radio-group>
      </el-form-item>
      <template v-if="radio === '1'">
        <el-form-item label="物流公司">
          <el-select v-model="formData.logisticsId" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="item in deliveryExpressList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="formData.logisticsNo" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as DeliveryExpressApi from '@/api/mall/trade/delivery/express'
import * as TradeOrderApi from '@/api/mall/trade/order'

defineOptions({ name: 'DeliveryOrderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const radio = ref('1')
const formData = ref<TradeOrderApi.DeliveryVO>({
  id: 0, // 订单编号
  logisticsId: null, // 物流公司编号
  logisticsNo: '' // 物流编号
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (orderId: number) => {
  resetForm()
  // 设置数据
  formData.value.id = orderId
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
    if (radio.value === '2') {
      data.logisticsId = 0
      data.logisticsNo = ''
    }
    await TradeOrderApi.delivery(data)
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
    logisticsId: null, // 物流公司编号
    logisticsNo: '' // 物流编号
  }
  formRef.value?.resetFields()
}
const deliveryExpressList = ref([])
onMounted(async () => {
  deliveryExpressList.value = await DeliveryExpressApi.getSimpleDeliveryExpressList()
})
</script>
