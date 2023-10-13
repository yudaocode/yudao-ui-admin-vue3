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
        <!-- 售后 -->
        <el-tab-pane label="售后">
          <el-form-item label="退款理由" prop="afterSaleRefundReasons">
            <el-select
              v-model="formData.afterSaleRefundReasons"
              filterable
              multiple
              allow-create
              placeholder="请直接输入退款理由"
            >
              <el-option
                v-for="reason in formData.afterSaleRefundReasons"
                :key="reason"
                :label="reason"
                :value="reason"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="退货理由" prop="afterSaleReturnReasons">
            <el-select
              v-model="formData.afterSaleReturnReasons"
              allow-create
              filterable
              multiple
              placeholder="请直接输入退货理由"
            >
              <el-option
                v-for="reason in formData.afterSaleReturnReasons"
                :key="reason"
                :label="reason"
                :value="reason"
              />
            </el-select>
          </el-form-item>
        </el-tab-pane>
        <!-- 配送 -->
        <el-tab-pane label="配送">
          <el-form-item label="启用包邮" prop="deliveryExpressFreeEnabled">
            <el-switch v-model="formData.deliveryExpressFreeEnabled" style="user-select: none" />
            <el-text class="w-full" size="small" type="info"> 商城是否启用全场包邮 </el-text>
          </el-form-item>
          <el-form-item label="满额包邮" prop="deliveryExpressFreePrice">
            <el-input-number
              v-model="formData.deliveryExpressFreePrice"
              placeholder="请输入满额包邮"
              class="!w-xs"
              :precision="2"
              :min="0"
            />
            <el-text class="w-full" size="small" type="info">
              商城商品满多少金额即可包邮，单位：元
            </el-text>
          </el-form-item>
          <el-form-item label="启用门店自提" prop="deliveryPickUpEnabled">
            <el-switch v-model="formData.deliveryPickUpEnabled" style="user-select: none" />
          </el-form-item>
        </el-tab-pane>
        <!-- 分销 -->
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
              首次绑定：只要用户没有推广人，随时都可以绑定推广关系
            </el-text>
            <el-text class="w-full" size="small" type="info">
              注册绑定：只有新用户注册时或首次进入系统时才可以绑定推广关系
            </el-text>
          </el-form-item>
          <el-form-item label="分销海报图">
            <UploadImgs v-model="formData.brokeragePosterUrls" width="75px" height="125px" />
            <el-text class="w-full" size="small" type="info">
              个人中心分销海报图片，建议尺寸 600x1000
            </el-text>
          </el-form-item>
          <el-form-item label="一级返佣比例" prop="brokerageFirstPercent">
            <el-input-number
              v-model="formData.brokerageFirstPercent"
              placeholder="请输入一级返佣比例"
              class="!w-xs"
              :min="0"
              :max="100"
            />
            <el-text class="w-full" size="small" type="info">
              订单交易成功后给推广人返佣的百分比
            </el-text>
          </el-form-item>
          <el-form-item label="二级返佣比例" prop="brokerageSecondPercent">
            <el-input-number
              v-model="formData.brokerageSecondPercent"
              placeholder="请输入二级返佣比例"
              class="!w-xs"
              :min="0"
              :max="100"
            />
            <el-text class="w-full" size="small" type="info">
              订单交易成功后给推广人的推荐人返佣的百分比
            </el-text>
          </el-form-item>
          <el-form-item label="佣金冻结天数" prop="brokerageFrozenDays">
            <el-input-number
              v-model="formData.brokerageFrozenDays"
              placeholder="请输入佣金冻结天数"
              class="!w-xs"
              :min="0"
            />
            <el-text class="w-full" size="small" type="info">
              防止用户退款，佣金被提现了，所以需要设置佣金冻结时间，单位：天
            </el-text>
          </el-form-item>
          <el-form-item label="提现最低金额" prop="brokerageWithdrawMinPrice">
            <el-input-number
              v-model="formData.brokerageWithdrawMinPrice"
              placeholder="请输入提现最低金额"
              class="!w-xs"
              :precision="2"
              :min="0"
            />
            <el-text class="w-full" size="small" type="info">
              用户提现最低金额限制，单位：元
            </el-text>
          </el-form-item>
          <el-form-item label="提现手续费" prop="brokerageWithdrawFeePercent">
            <el-input-number
              v-model="formData.brokerageWithdrawFeePercent"
              placeholder="请输入提现手续费"
              class="!w-xs"
              :min="0"
              :max="100"
            />
            <el-text class="w-full" size="small" type="info">
              提现手续费百分比，范围 0-100，0 为无提现手续费。例：设置 10，即收取 10% 手续费，提现
              10 元，到账 9 元，1 元手续费
            </el-text>
          </el-form-item>
          <el-form-item label="提现方式" prop="brokerageWithdrawTypes">
            <el-checkbox-group v-model="formData.brokerageWithdrawTypes">
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
      <!-- 保存 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="formLoading"> 保存 </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>

<script setup lang="ts">
import * as ConfigApi from '@/api/mall/trade/config'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'TradeConfig' })

const message = useMessage() // 消息弹窗

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formRef = ref()
const formData = ref({
  id: null,
  afterSaleRefundReasons: [],
  afterSaleReturnReasons: [],
  deliveryExpressFreeEnabled: false,
  deliveryExpressFreePrice: 0,
  deliveryPickUpEnabled: false,
  brokerageEnabled: false,
  brokerageEnabledCondition: undefined,
  brokerageBindMode: undefined,
  brokeragePosterUrls: [],
  brokerageFirstPercent: 0,
  brokerageSecondPercent: 0,
  brokerageWithdrawMinPrice: 0,
  brokerageWithdrawFeePercent: 0,
  brokerageBankNames: [],
  brokerageFrozenDays: 0,
  brokerageWithdrawTypes: []
})
const formRules = reactive({
  deliveryExpressFreePrice: [{ required: true, message: '满额包邮不能为空', trigger: 'blur' }],
  brokerageEnabledCondition: [{ required: true, message: '分佣模式不能为空', trigger: 'blur' }],
  brokerageBindMode: [{ required: true, message: '分销关系绑定模式不能为空', trigger: 'blur' }],
  brokerageFirstPercent: [{ required: true, message: '一级返佣比例不能为空', trigger: 'blur' }],
  brokerageSecondPercent: [{ required: true, message: '二级返佣比例不能为空', trigger: 'blur' }],
  brokerageWithdrawMinPrice: [
    { required: true, message: '用户提现最低金额不能为空', trigger: 'blur' }
  ],
  brokerageWithdrawFeePercent: [{ required: true, message: '提现手续费不能为空', trigger: 'blur' }],
  brokerageBankNames: [{ required: true, message: '提现银行不能为空', trigger: 'blur' }],
  brokerageFrozenDays: [{ required: true, message: '佣金冻结时间不能为空', trigger: 'blur' }],
  brokerageWithdrawTypes: [
    {
      required: true,
      message: '提现方式不能为空',
      trigger: 'change'
    }
  ]
})

const submitForm = async () => {
  if (formLoading.value) return
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = {
      ...formData.value
    } as unknown as ConfigApi.ConfigVO
    data.brokeragePosterUrls = formData.value.brokeragePosterUrls.map((item: any) => {
      return item?.url ? item.url : item
    })
    // 金额放大
    data.deliveryExpressFreePrice = data.deliveryExpressFreePrice * 100
    data.brokerageWithdrawMinPrice = data.brokerageWithdrawMinPrice * 100
    await ConfigApi.saveTradeConfig(data)
    message.success('保存成功')
  } finally {
    formLoading.value = false
  }
}

/** 查询交易中心配置 */
const getConfig = async () => {
  formLoading.value = true
  try {
    const data = await ConfigApi.getTradeConfig()
    if (data != null) {
      data.brokeragePosterUrls = data.brokeragePosterUrls.map((url) => ({ url }))
      formData.value = data
      // 金额缩小
      formData.value.deliveryExpressFreePrice = data.deliveryExpressFreePrice / 100
      formData.value.brokerageWithdrawMinPrice = data.brokerageWithdrawMinPrice / 100
    }
  } finally {
    formLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getConfig()
})
</script>
