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

      <el-tabs>
        <el-tab-pane label="积分">
          <el-form-item label="积分抵扣" prop="tradeDeductEnable" class="item-bottom">
            <el-switch v-model="formData.tradeDeductEnable" style="user-select: none" />
            <el-text class="w-full" size="small" type="info">下单积分是否抵用订单金额</el-text>
          </el-form-item>
          <el-form-item label="积分抵扣" prop="tradeDeductUnitPrice">
            <el-input-number
              v-model="computedTradeDeductUnitPrice"
              placeholder="请输入积分抵扣金额"
              :precision="2"
            />
            <el-text class="w-full" size="small" type="info">
              积分抵用比例(1 积分抵多少金额)，单位：元
            </el-text>
          </el-form-item>
          <el-form-item label="积分抵扣最大值" prop="tradeDeductMaxPrice">
            <el-input-number
              v-model="formData.tradeDeductMaxPrice"
              placeholder="请输入积分抵扣最大值"
            />
            <el-text class="w-full" size="small" type="info">
              单次下单积分使用上限，0 不限制
            </el-text>
          </el-form-item>
          <el-form-item label="1 元赠送多少分" prop="tradeGivePoint">
            <el-input-number
              v-model="formData.tradeGivePoint"
              placeholder="请输入 1 元赠送多少积分"
            />
            <el-text class="w-full" size="small" type="info">
              下单支付金额按比例赠送积分（实际支付 1 元赠送多少积分）
            </el-text>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane label="分销">
          <el-form-item label="分佣启用" prop="brokerageEnabled">
            <el-switch v-model="formData.brokerageEnabled" style="user-select: none" />
            <el-text class="w-full" size="small" type="info"> 商城是否开启分销模式 </el-text>
          </el-form-item>
          <el-form-item label="分佣模式" prop="brokerageEnabledCondition">
            <el-radio-group v-model="formData.brokerageEnabledCondition">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_ENABLED_CONDITION)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
            <el-text class="w-full" size="small" type="info">
              人人分销：每个用户都可以成为推广员
            </el-text>
            <el-text class="w-full" size="small" type="info">
              指定分销：仅可在后台手动设置推广员
            </el-text>
          </el-form-item>
          <el-form-item label="分销关系绑定" prop="brokerageBindMode">
            <el-radio-group v-model="formData.brokerageBindMode">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_BIND_MODE)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
            <el-text class="w-full" size="small" type="info">
              没有推广人：只要用户没有推广人，随时都可以绑定推广关系
            </el-text>
            <el-text class="w-full" size="small" type="info">
              新用户：只有新用户注册时或首次进入系统时才可以绑定推广关系
            </el-text>
          </el-form-item>
          <el-form-item label="分销海报图">
            <UploadImgs v-model="formData.brokeragePostUrls" width="75px" height="125px" />
            <el-text class="w-full" size="small" type="info">
              个人中心分销海报图片，建议尺寸600x1000
            </el-text>
          </el-form-item>
          <el-form-item label="一级返佣比例" prop="brokerageFirstPercent">
            <el-input-number
              v-model="formData.brokerageFirstPercent"
              placeholder="请输入一级返佣比例"
            />
            <el-text class="w-full" size="small" type="info">
              订单交易成功后给推广人返佣的百分比
            </el-text>
          </el-form-item>
          <el-form-item label="二级返佣比例" prop="brokerageSecondPercent">
            <el-input-number
              v-model="formData.brokerageSecondPercent"
              placeholder="请输入二级返佣比例"
            />
            <el-text class="w-full" size="small" type="info">
              订单交易成功后给推广人的推荐人返佣的百分比
            </el-text>
          </el-form-item>
          <el-form-item label="佣金冻结天数" prop="brokerageFrozenDays">
            <el-input-number
              v-model="formData.brokerageFrozenDays"
              placeholder="请输入佣金冻结天数"
            />
            <el-text class="w-full" size="small" type="info">
              防止用户退款，佣金被提现了，所以需要设置佣金冻结时间，单位：天
            </el-text>
          </el-form-item>
          <el-form-item label="提现最低金额" prop="brokerageWithdrawMinPrice">
            <el-input-number
              v-model="formData.brokerageWithdrawMinPrice"
              placeholder="请输入用户提现最低金额"
            />
            <el-text class="w-full" size="small" type="info">
              用户提现最低金额限制，单位：元
            </el-text>
          </el-form-item>
          <el-form-item label="提现方式" prop="brokerageWithdrawType">
            <el-checkbox-group v-model="formData.brokerageWithdrawType">
              <el-checkbox
                v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_WITHDRAW_TYPE)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-checkbox>
            </el-checkbox-group>
            <el-text class="w-full" size="small" type="info"> 商城开通提现的付款方式 </el-text>
          </el-form-item>
          <el-form-item label="提现银行" prop="brokerageBankNames">
            <el-select v-model="formData.brokerageBankNames" placeholder="请选择提现银行" multiple>
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_BANK_NAME)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
            <el-text class="w-full" size="small" type="info"> 商城开通提现的银行列表 </el-text>
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
import * as ConfigApi from '@/api/member/point/config'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BrokerageBindModeEnum, BrokerageEnabledConditionEnum } from '@/utils/constants'

defineOptions({ name: 'MemberPointConfig' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: undefined,
  tradeDeductEnable: true,
  tradeDeductUnitPrice: 0,
  tradeDeductMaxPrice: 0,
  tradeGivePoint: 0,
  brokerageEnabled: true,
  brokerageEnabledCondition: BrokerageEnabledConditionEnum.ALL.condition,
  brokerageBindMode: BrokerageBindModeEnum.ANYTIME.mode,
  brokeragePostUrls: [],
  brokerageFirstPercent: 0,
  brokerageSecondPercent: 0,
  brokerageWithdrawMinPrice: 0,
  brokerageBankNames: [],
  brokerageFrozenDays: 0,
  brokerageWithdrawType: []
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
    data.brokeragePostUrls = formData.value.brokeragePostUrls.map((item: any) => {
      return item?.url ? item.url : item
    })
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
    data.brokeragePostUrls = data.brokeragePostUrls.map((url) => ({ url }))
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
