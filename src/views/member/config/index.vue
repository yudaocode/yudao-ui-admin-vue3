<template>
  <doc-alert title="会员手册（功能开启）" url="https://doc.iocoder.cn/member/build/" />

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

      <el-tabs>
        <el-tab-pane label="积分">
          <el-form-item label="积分抵扣" prop="pointTradeDeductEnable">
            <el-switch v-model="formData.pointTradeDeductEnable" style="user-select: none" />
            <el-text class="w-full" size="small" type="info">下单积分是否抵用订单金额</el-text>
          </el-form-item>
          <el-form-item label="积分抵扣" prop="pointTradeDeductUnitPrice">
            <el-input-number
              v-model="computedPointTradeDeductUnitPrice"
              placeholder="请输入积分抵扣金额"
              :precision="2"
            />
            <el-text class="w-full" size="small" type="info">
              积分抵用比例(1 积分抵多少金额)，单位：元
            </el-text>
          </el-form-item>
          <el-form-item label="积分抵扣最大值" prop="pointTradeDeductMaxPrice">
            <el-input-number
              v-model="formData.pointTradeDeductMaxPrice"
              placeholder="请输入积分抵扣最大值"
            />
            <el-text class="w-full" size="small" type="info">
              单次下单积分使用上限，0 不限制
            </el-text>
          </el-form-item>
          <el-form-item label="1 元赠送多少分" prop="pointTradeGivePoint">
            <el-input-number
              v-model="formData.pointTradeGivePoint"
              placeholder="请输入 1 元赠送多少积分"
            />
            <el-text class="w-full" size="small" type="info">
              下单支付金额按比例赠送积分（实际支付 1 元赠送多少积分）
            </el-text>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>

      <el-form-item>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/member/config'

defineOptions({ name: 'MemberConfig' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  pointTradeDeductEnable: true,
  pointTradeDeductUnitPrice: 0,
  pointTradeDeductMaxPrice: 0,
  pointTradeGivePoint: 0
})

// 创建一个计算属性，用于将 pointTradeDeductUnitPrice 显示为带两位小数的形式
const computedPointTradeDeductUnitPrice = computed({
  get: () => (formData.value.pointTradeDeductUnitPrice / 100).toFixed(2),
  set: (newValue: number) => {
    formData.value.pointTradeDeductUnitPrice = Math.round(newValue * 100)
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
