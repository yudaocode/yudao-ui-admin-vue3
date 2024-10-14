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
      <el-form-item label="优惠券描述" prop="description">
        <el-input
          v-model="formData.description"
          :autosize="{ minRows: 2, maxRows: 2 }"
          :clearable="true"
          :show-word-limit="true"
          class="w-1/1!"
          maxlength="512"
          placeholder="请输入优惠券描述"
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="优惠劵类型" prop="productScope">
        <el-radio-group v-model="formData.productScope">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_PRODUCT_SCOPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="formData.productScope === PromotionProductScopeEnum.SPU.scope"
        label="商品"
        prop="productSpuIds"
      >
        <SpuShowcase v-model="formData.productSpuIds" />
      </el-form-item>
      <el-form-item
        v-if="formData.productScope === PromotionProductScopeEnum.CATEGORY.scope"
        label="分类"
        prop="productCategoryIds"
      >
        <ProductCategorySelect v-model="formData.productCategoryIds" />
      </el-form-item>
      <el-form-item label="优惠类型" prop="discountType">
        <el-radio-group v-model="formData.discountType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE)"
            :key="dict.value"
            :value="dict.value"
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
          :min="0"
          :precision="2"
          class="mr-2 !w-400px"
          placeholder="请输入优惠金额，单位：元"
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
          :max="9.9"
          :min="1"
          :precision="1"
          class="mr-2 !w-400px"
          placeholder="优惠券折扣不能小于 1 折，且不可大于 9.9 折"
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
          :min="0"
          :precision="2"
          class="mr-2 !w-400px"
          placeholder="请输入最多优惠"
        />
        元
      </el-form-item>
      <el-form-item label="满多少元可以使用" prop="usePrice">
        <el-input-number
          v-model="formData.usePrice"
          :min="0"
          :precision="2"
          class="mr-2 !w-400px"
          placeholder="无门槛请设为 0"
        />
        元
      </el-form-item>
      <el-form-item label="领取方式" prop="takeType">
        <el-radio-group v-model="formData.takeType">
          <el-radio :key="1" :value="1">直接领取</el-radio>
          <el-radio :key="2" :value="2">指定发放</el-radio>
          <el-radio :key="2" :value="3">新人劵</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.takeType === 1" label="发放数量" prop="totalCount">
        <el-input-number
          v-model="formData.totalCount"
          :min="-1"
          :precision="0"
          class="mr-2 !w-400px"
          placeholder="发放数量，没有之后不能领取或发放，-1 为不限制"
        />
        张
      </el-form-item>
      <el-form-item v-if="formData.takeType === 1" label="每人限领个数" prop="takeLimitCount">
        <el-input-number
          v-model="formData.takeLimitCount"
          :min="-1"
          :precision="0"
          class="mr-2 !w-400px"
          placeholder="设置为 -1 时，可无限领取"
        />
        张
      </el-form-item>
      <el-form-item label="有效期类型" prop="validityType">
        <el-radio-group v-model="formData.validityType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE)"
            :key="dict.value"
            :value="dict.value"
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
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)]"
          type="datetimerange"
          value-format="x"
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
          :min="0"
          :precision="0"
          class="mx-2"
          placeholder="0 为今天生效"
        />
        至
        <el-input-number
          v-model="formData.fixedEndTerm"
          :min="0"
          :precision="0"
          class="mx-2"
          placeholder="请输入结束天数"
        />
        天有效
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
import {
  CouponTemplateValidityTypeEnum,
  PromotionDiscountTypeEnum,
  PromotionProductScopeEnum
} from '@/utils/constants'
import SpuShowcase from '@/views/mall/product/spu/components/SpuShowcase.vue'
import ProductCategorySelect from '@/views/mall/product/category/components/ProductCategorySelect.vue'
import { convertToInteger, formatToFraction } from '@/utils'

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
  description: undefined,
  productScopeValues: [], // 商品范围：值为 品类编号列表 或 商品编号列表 ，用于提交
  productCategoryIds: [], // 仅用于表单，不提交
  productSpuIds: [] // 仅用于表单，不提交
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
  productSpuIds: [{ required: true, message: '商品不能为空', trigger: 'blur' }],
  productCategoryIds: [{ required: true, message: '分类不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
        discountPrice: formatToFraction(data.discountPrice),
        discountPercent:
          data.discountPercent !== undefined ? data.discountPercent / 10.0 : undefined,
        discountLimitPrice: formatToFraction(data.discountLimitPrice),
        usePrice: formatToFraction(data.usePrice),
        validTimes: [data.validStartTime, data.validEndTime]
      }
      // 获得商品范围
      await getProductScope()
    } finally {
      formLoading.value = false
    }
  }
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
      discountPrice: convertToInteger(formData.value.discountPrice),
      discountPercent:
        formData.value.discountPercent !== undefined
          ? formData.value.discountPercent * 10
          : undefined,
      discountLimitPrice: convertToInteger(formData.value.discountLimitPrice),
      usePrice: convertToInteger(formData.value.usePrice),
      validStartTime:
        formData.value.validTimes && formData.value.validTimes.length === 2
          ? formData.value.validTimes[0]
          : undefined,
      validEndTime:
        formData.value.validTimes && formData.value.validTimes.length === 2
          ? formData.value.validTimes[1]
          : undefined,
      totalCount: formData.value.takeType === 1 ? formData.value.totalCount : -1,
      takeLimitCount: formData.value.takeType === 1 ? formData.value.takeLimitCount : -1
    } as unknown as CouponTemplateApi.CouponTemplateVO

    // 设置商品范围
    setProductScopeValues(data)

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
    description: undefined,
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
    productScopeValues: [],
    productSpuIds: [],
    productCategoryIds: []
  }
  formRef.value?.resetFields()
}

/** 获得商品范围 */
const getProductScope = async () => {
  switch (formData.value.productScope) {
    case PromotionProductScopeEnum.SPU.scope:
      // 设置商品编号
      formData.value.productSpuIds = formData.value.productScopeValues
      break
    case PromotionProductScopeEnum.CATEGORY.scope:
      await nextTick(() => {
        let productCategoryIds = formData.value.productScopeValues
        if (Array.isArray(productCategoryIds) && productCategoryIds.length > 0) {
          // 单选时使用数组不能反显
          productCategoryIds = productCategoryIds[0]
        }
        // 设置品类编号
        formData.value.productCategoryIds = productCategoryIds
      })
      break
    default:
      break
  }
}

/** 设置商品范围 */
function setProductScopeValues(data: CouponTemplateApi.CouponTemplateVO) {
  switch (formData.value.productScope) {
    case PromotionProductScopeEnum.SPU.scope:
      data.productScopeValues = formData.value.productSpuIds
      break
    case PromotionProductScopeEnum.CATEGORY.scope:
      data.productScopeValues = Array.isArray(formData.value.productCategoryIds)
        ? formData.value.productCategoryIds
        : [formData.value.productCategoryIds]
      break
    default:
      break
  }
}
</script>

<style lang="scss" scoped></style>
