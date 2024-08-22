<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="60%">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="活动名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入活动名称" />
      </el-form-item>
      <el-form-item label="活动时间" prop="startAndEndTime">
        <el-date-picker
          v-model="formData.startAndEndTime"
          :end-placeholder="t('common.endTimeText')"
          :start-placeholder="t('common.startTimeText')"
          range-separator="-"
          type="datetimerange"
        />
      </el-form-item>
      <el-form-item label="条件类型" prop="conditionType">
        <el-radio-group v-model="formData.conditionType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_CONDITION_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="优惠设置">
        <RewardRule v-model="formData" />
      </el-form-item>
      <el-form-item label="活动范围" prop="productScope">
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
        <SpuShowcase v-model="formData.productSpuIds" />
      </el-form-item>
      <el-form-item
        v-if="formData.productScope === PromotionProductScopeEnum.CATEGORY.scope"
        label="分类"
        prop="productCategoryIds"
      >
        <ProductCategorySelect v-model="formData.productCategoryIds" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import RewardRule from './components/RewardRule.vue'
import SpuShowcase from '@/views/mall/product/spu/components/SpuShowcase.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as RewardActivityApi from '@/api/mall/promotion/reward/rewardActivity'
import { PromotionConditionTypeEnum, PromotionProductScopeEnum } from '@/utils/constants'
import ProductCategorySelect from '@/views/mall/product/category/components/ProductCategorySelect.vue'

defineOptions({ name: 'ProductBrandForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<RewardActivityApi.RewardActivityVO>({
  conditionType: PromotionConditionTypeEnum.PRICE.type,
  productScope: PromotionProductScopeEnum.ALL.scope,
  rules: []
} as RewardActivityApi.RewardActivityVO)
const formRules = reactive({
  name: [{ required: true, message: '活动名称不能为空', trigger: 'blur' }],
  startAndEndTime: [{ required: true, message: '活动时间不能为空', trigger: 'blur' }],
  conditionType: [{ required: true, message: '条件类型不能为空', trigger: 'change' }],
  productScope: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }],
  productSpuIds: [{ required: true, message: '商品不能为空', trigger: 'blur' }],
  productCategoryIds: [{ required: true, message: '商品分类不能为空', trigger: 'blur' }]
})
const formRef = ref([]) // 表单 Ref

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
      const data = await RewardActivityApi.getReward(id)
      data.startAndEndTime = [data.startTime, data.endTime]
      formData.value = data
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
  // TODO puhui999: 规则校验
  // const valid = await formRef.value.validate()
  // if (!valid) return
  // TODO puhui999: 处理下数据兼容接口

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    // 设置商品范围
    setProductScopeValues(data)
    if (formType.value === 'create') {
      await RewardActivityApi.createRewardActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await RewardActivityApi.updateRewardActivity(data)
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
    conditionType: PromotionConditionTypeEnum.PRICE.type,
    productScope: PromotionProductScopeEnum.ALL.scope,
    rules: []
  } as RewardActivityApi.RewardActivityVO
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
        let productCategoryIds = formData.value.productScopeValues as any
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
function setProductScopeValues(data: any) {
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
