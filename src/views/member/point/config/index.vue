<template>
  <ContentWrap>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="hideId" v-show="false">
        <el-input v-model="formData.id" />
      </el-form-item>
      <el-form-item label="积分抵扣" prop="tradeDeductEnable" class="item-bottom">
        <el-switch v-model="formData.tradeDeductEnable" style="user-select: none" />
      </el-form-item>
      <el-form-item>
        <el-text class="mx-1" size="small" type="info">下单积分是否抵用订单金额</el-text>
      </el-form-item>
      <el-form-item label="积分抵扣" prop="tradeDeductUnitPrice" class="item-bottom">
        <el-input-number
          v-model="computedTradeDeductUnitPrice"
          placeholder="请输入积分抵扣金额"
          style="width: 300px"
          :precision="2"
        />
      </el-form-item>
      <el-form-item>
        <el-text class="mx-1" size="small" type="info">
          积分抵用比例(1 积分抵多少金额)，单位：元
        </el-text>
      </el-form-item>
      <el-form-item label="积分抵扣最大值" prop="tradeDeductMaxPrice" class="item-bottom">
        <el-input-number
          v-model="formData.tradeDeductMaxPrice"
          placeholder="请输入积分抵扣最大值"
          style="width: 300px"
        />
      </el-form-item>
      <el-form-item>
        <el-text class="mx-1" size="small" type="info">单次下单积分使用上限，0 不限制</el-text>
      </el-form-item>
      <el-form-item label="1 元赠送多少分" prop="tradeGivePoint" class="item-bottom">
        <el-input-number
          v-model="formData.tradeGivePoint"
          placeholder="请输入 1 元赠送多少积分"
          style="width: 300px"
        />
      </el-form-item>
      <el-form-item>
        <el-text class="mx-1" size="small" type="info">
          下单支付金额按比例赠送积分（实际支付 1 元赠送多少积分）
        </el-text>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/member/point/config'

defineOptions({ name: 'MemberPointConfig' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  tradeDeductEnable: true,
  tradeDeductUnitPrice: 0,
  tradeDeductMaxPrice: 0,
  tradeGivePoint: 0
})

// 创建一个计算属性，用于将 tradeDeductUnitPrice 显示为带两位小数的形式
const computedTradeDeductUnitPrice = computed({
  get: () => (formData.value.tradeDeductUnitPrice / 100).toFixed(2),
  set: (newValue) => {
    formData.value.tradeDeductUnitPrice = Math.round(newValue * 100)
  }
})

const formRules = reactive({})
const formRef = ref() // 表单 Ref

/** 修改积分配置 */
const onSubmit = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ConfigApi.ConfigVO
    await ConfigApi.saveConfig(data)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 获得积分配置 */
const getConfig = async () => {
  try {
    const data = await ConfigApi.getConfig()
    if (data === null) {
      return
    }
    formData.value = data
  } finally {
  }
}

onMounted(() => {
  getConfig()
})
</script>

<style scoped>
.item-bottom {
  margin-bottom: 0;
}
</style>
