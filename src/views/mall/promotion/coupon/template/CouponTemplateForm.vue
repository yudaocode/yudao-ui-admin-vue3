<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="140px"
    >
      <el-form-item label="优惠券名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入优惠券名称" />
      </el-form-item>
      <el-form-item label="优惠券类型" prop="discountType">
        <el-radio-group v-model="formData.discountType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.discountType === PromotionDiscountTypeEnum.PRICE.type"
        label="优惠券面额"
        prop="discountPrice"
      >
        <el-input-number
          v-model="formData.discountPrice"
          placeholder="请输入优惠金额，单位：元"
          style="width: 400px"
          :precision="2"
          :min="0"
        />
        元
      </el-form-item>
      <el-form-item
        v-if="formData.discountType === PromotionDiscountTypeEnum.PERCENT.type"
        label="优惠券折扣"
        prop="discountPercent"
      >
        <el-input-number
          v-model="formData.discountPercent"
          placeholder="优惠券折扣不能小于 1 折，且不可大于 9.9 折"
          style="width: 400px"
          :precision="1"
          :min="1"
          :max="9.9"
        />
        折
      </el-form-item>
      <el-form-item
        v-if="formData.discountType === PromotionDiscountTypeEnum.PERCENT.type"
        label="最多优惠"
        prop="discountLimitPrice"
      >
        <el-input-number
          v-model="formData.discountLimitPrice"
          placeholder="请输入最多优惠"
          style="width: 400px"
          :precision="2"
          :min="0"
        />
        元
      </el-form-item>
      <el-form-item label="满多少元可以使用" prop="usePrice">
        <el-input-number
          v-model="formData.usePrice"
          placeholder="无门槛请设为 0"
          style="width: 400px"
          :precision="2"
          :min="0"
        />
        元
      </el-form-item>
      <el-form-item label="领取方式" prop="takeType">
        <el-radio-group v-model="formData.takeType">
          <el-radio :key="1" :label="1">直接领取</el-radio>
          <el-radio :key="2" :label="2">指定发放</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.takeType === 1" label="发放数量" prop="totalCount">
        <el-input-number
          v-model="formData.totalCount"
          placeholder="发放数量，没有之后不能领取或发放，-1 为不限制"
          style="width: 400px"
          :precision="0"
          :min="-1"
        />
        张
      </el-form-item>
      <el-form-item v-if="formData.takeType === 1" label="每人限领个数" prop="takeLimitCount">
        <el-input-number
          v-model="formData.takeLimitCount"
          placeholder="设置为 -1 时，可无限领取"
          style="width: 400px"
          :precision="0"
          :min="-1"
        />
        张
      </el-form-item>
      <el-form-item label="有效期类型" prop="validityType">
        <el-radio-group v-model="formData.validityType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.validityType === CouponTemplateValidityTypeEnum.DATE.type"
        label="固定日期"
        prop="validTimes"
      >
        <el-date-picker
          v-model="formData.validTimes"
          style="width: 240px"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)]"
        />
      </el-form-item>
      <el-form-item
        v-if="formData.validityType === CouponTemplateValidityTypeEnum.TERM.type"
        label="领取日期"
        prop="fixedStartTerm"
      >
        第
        <el-input-number
          v-model="formData.fixedStartTerm"
          placeholder="0 为今天生效"
          style="width: 165px"
          :precision="0"
          :min="0"
        />
        至
        <el-input-number
          v-model="formData.fixedEndTerm"
          placeholder="请输入结束天数"
          style="width: 165px"
          :precision="0"
          :min="0"
        />
        天有效
      </el-form-item>
      <el-form-item label="活动商品" prop="productScope">
        <el-radio-group v-model="formData.productScope">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_PRODUCT_SCOPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.productScope === PromotionProductScopeEnum.SPU.scope"
        prop="productSpuIds"
      >
        <el-select
          v-model="formData.productSpuIds"
          placeholder="请选择活动商品"
          clearable
          multiple
          filterable
          style="width: 400px"
        >
          <el-option v-for="item in productSpus" :key="item.id" :label="item.name" :value="item.id">
            <span style="float: left">{{ item.name }}</span>
            <span style="float: right; font-size: 13px; color: #8492a6">
              ￥{{ (item.minPrice / 100.0).toFixed(2) }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import * as ProductSpuApi from '@/api/mall/product/spu'
import {
  CouponTemplateValidityTypeEnum,
  PromotionDiscountTypeEnum,
  PromotionProductScopeEnum
} from '@/utils/constants'

defineOptions({ name: 'CouponTemplateForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  discountType: PromotionDiscountTypeEnum.PRICE.type,
  discountPrice: undefined,
  discountPercent: undefined,
  discountLimitPrice: undefined,
  usePrice: undefined,
  takeType: 1,
  totalCount: undefined,
  takeLimitCount: undefined,
  validityType: CouponTemplateValidityTypeEnum.DATE.type,
  validTimes: [],
  validStartTime: undefined,
  validEndTime: undefined,
  fixedStartTerm: undefined,
  fixedEndTerm: undefined,
  productScope: PromotionProductScopeEnum.ALL.scope,
  productSpuIds: []
})
const formRules = reactive({
  name: [{ required: true, message: '优惠券名称不能为空', trigger: 'blur' }],
  discountType: [{ required: true, message: '优惠券类型不能为空', trigger: 'change' }],
  discountPrice: [{ required: true, message: '优惠券面额不能为空', trigger: 'blur' }],
  discountPercent: [{ required: true, message: '优惠券折扣不能为空', trigger: 'blur' }],
  discountLimitPrice: [{ required: true, message: '最多优惠不能为空', trigger: 'blur' }],
  usePrice: [{ required: true, message: '满多少元可以使用不能为空', trigger: 'blur' }],
  takeType: [{ required: true, message: '领取方式不能为空', trigger: 'change' }],
  totalCount: [{ required: true, message: '发放数量不能为空', trigger: 'blur' }],
  takeLimitCount: [{ required: true, message: '每人限领个数不能为空', trigger: 'blur' }],
  validityType: [{ required: true, message: '有效期类型不能为空', trigger: 'change' }],
  validTimes: [{ required: true, message: '固定日期不能为空', trigger: 'change' }],
  fixedStartTerm: [{ required: true, message: '开始领取天数不能为空', trigger: 'blur' }],
  fixedEndTerm: [{ required: true, message: '开始领取天数不能为空', trigger: 'blur' }],
  productScope: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }],
  productSpuIds: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const productSpus = ref([]) // 商品列表

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await CouponTemplateApi.getCouponTemplate(id)
      formData.value = {
        ...data,
        discountPrice: data.discountPrice !== undefined ? data.discountPrice / 100.0 : undefined,
        discountPercent:
          data.discountPercent !== undefined ? data.discountPercent / 10.0 : undefined,
        discountLimitPrice:
          data.discountLimitPrice !== undefined ? data.discountLimitPrice / 100.0 : undefined,
        usePrice: data.usePrice !== undefined ? data.usePrice / 100.0 : undefined,
        validTimes: [data.validStartTime, data.validEndTime]
      }
    } finally {
      formLoading.value = false
    }
  }
  // 获得商品列表
  productSpus.value = await ProductSpuApi.getSpuSimpleList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      discountPrice:
        formData.value.discountPrice !== undefined ? formData.value.discountPrice * 100 : undefined,
      discountPercent:
        formData.value.discountPercent !== undefined
          ? formData.value.discountPercent * 10
          : undefined,
      discountLimitPrice:
        formData.value.discountLimitPrice !== undefined
          ? formData.value.discountLimitPrice * 100
          : undefined,
      usePrice: formData.value.usePrice !== undefined ? formData.value.usePrice * 100 : undefined,
      validStartTime:
        formData.value.validTimes && formData.value.validTimes.length === 2
          ? formData.value.validTimes[0]
          : undefined,
      validEndTime:
        formData.value.validTimes && formData.value.validTimes.length === 2
          ? formData.value.validTimes[1]
          : undefined
    } as CouponTemplateApi.CouponTemplateVO
    if (formType.value === 'create') {
      await CouponTemplateApi.createCouponTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await CouponTemplateApi.updateCouponTemplate(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    discountType: PromotionDiscountTypeEnum.PRICE.type,
    discountPrice: undefined,
    discountPercent: undefined,
    discountLimitPrice: undefined,
    usePrice: undefined,
    takeType: 1,
    totalCount: undefined,
    takeLimitCount: undefined,
    validityType: CouponTemplateValidityTypeEnum.DATE.type,
    validTimes: [],
    validStartTime: undefined,
    validEndTime: undefined,
    fixedStartTerm: undefined,
    fixedEndTerm: undefined,
    productScope: PromotionProductScopeEnum.ALL.scope,
    productSpuIds: []
  }
  formRef.value?.resetFields()
}
</script>
