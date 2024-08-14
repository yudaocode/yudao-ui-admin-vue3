<!-- 商品发布 - 库存价格 -->
<template>
  <el-form
    ref="formRef"
    :disabled="isDetail"
    :model="formData"
    :rules="rules"
    label-width="120px"
    v-loading="formLoading"
  >
    <el-form-item label="分销类型" props="subCommissionType">
      <el-radio-group
        v-model="formData.subCommissionType"
        class="w-80"
        @change="changeSubCommissionType"
      >
        <el-radio :label="false">默认设置</el-radio>
        <el-radio :label="true" class="radio">单独设置</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="商品规格" props="specType">
      <el-radio-group v-model="formData.specType" class="w-80" @change="onChangeSpec">
        <el-radio :label="false" class="radio">单规格</el-radio>
        <el-radio :label="true">多规格</el-radio>
      </el-radio-group>
    </el-form-item>
    <!-- 多规格添加-->
    <el-form-item v-if="!formData.specType">
      <SkuList
        ref="skuListRef"
        :prop-form-data="formData"
        :property-list="propertyList"
        :rule-config="ruleConfig"
      />
    </el-form-item>
    <el-form-item v-if="formData.specType" label="商品属性">
      <el-button class="mb-10px mr-15px" @click="attributesAddFormRef.open">添加属性</el-button>
      <ProductAttributes
        :is-detail="isDetail"
        :property-list="propertyList"
        @success="generateSkus"
      />
    </el-form-item>
    <template v-if="formData.specType && propertyList.length > 0">
      <el-form-item v-if="!isDetail" label="批量设置">
        <SkuList :is-batch="true" :prop-form-data="formData" :property-list="propertyList" />
      </el-form-item>
      <el-form-item label="规格列表">
        <SkuList
          ref="skuListRef"
          :is-detail="isDetail"
          :prop-form-data="formData"
          :property-list="propertyList"
          :rule-config="ruleConfig"
        />
      </el-form-item>
    </template>
  </el-form>

  <!-- 商品属性添加 Form 表单 -->
  <ProductPropertyAddForm ref="attributesAddFormRef" :propertyList="propertyList" />
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { copyValueToTarget } from '@/utils'
import { propTypes } from '@/utils/propTypes'
import {
  getPropertyList,
  PropertyAndValues,
  RuleConfig,
  SkuList
} from '@/views/mall/product/spu/components/index'
import ProductAttributes from './ProductAttributes.vue'
import ProductPropertyAddForm from './ProductPropertyAddForm.vue'
import type { Spu } from '@/api/mall/product/spu'

defineOptions({ name: 'ProductSpuSkuForm' })

// sku 相关属性校验规则
const ruleConfig: RuleConfig[] = [
  {
    name: 'stock',
    rule: (arg) => arg >= 0,
    message: '商品库存必须大于等于 1 ！！！'
  },
  {
    name: 'price',
    rule: (arg) => arg >= 0.01,
    message: '商品销售价格必须大于等于 0.01 元！！！'
  },
  {
    name: 'marketPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品市场价格必须大于等于 0.01 元！！！'
  },
  {
    name: 'costPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品成本价格必须大于等于 0.00 元！！！'
  }
]

const message = useMessage() // 消息弹窗
const formLoading = ref(false)
const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})
const attributesAddFormRef = ref() // 添加商品属性表单
const formRef = ref() // 表单 Ref
const propertyList = ref<PropertyAndValues[]>([]) // 商品属性列表
const skuListRef = ref() // 商品属性列表 Ref
const formData = reactive<Spu>({
  specType: false, // 商品规格
  subCommissionType: false, // 分销类型
  skus: []
})
const rules = reactive({
  specType: [required],
  subCommissionType: [required]
})

/** 将传进来的值赋值给 formData */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return
    }
    copyValueToTarget(formData, data)
    // 将 SKU 的属性，整理成 PropertyAndValues 数组
    propertyList.value = getPropertyList(data)
  },
  {
    immediate: true
  }
)

/** 表单校验 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  if (!formRef) return
  try {
    // 校验 sku
    skuListRef.value.validateSku()
    await unref(formRef).validate()
    // 校验通过更新数据
    Object.assign(props.propFormData, formData)
  } catch (e) {
    message.error('【库存价格】不完善，请填写相关信息')
    emit('update:activeName', 'sku')
    throw e // 目的截断之后的校验
  }
}
defineExpose({ validate })

/** 分销类型 */
const changeSubCommissionType = () => {
  // 默认为零，类型切换后也要重置为零
  for (const item of formData.skus!) {
    item.firstBrokeragePrice = 0
    item.secondBrokeragePrice = 0
  }
}

/** 选择规格 */
const onChangeSpec = () => {
  // 重置商品属性列表
  propertyList.value = []
  // 重置sku列表
  formData.skus = [
    {
      price: 0,
      marketPrice: 0,
      costPrice: 0,
      barCode: '',
      picUrl: '',
      stock: 0,
      weight: 0,
      volume: 0,
      firstBrokeragePrice: 0,
      secondBrokeragePrice: 0
    }
  ]
}

/** 调用 SkuList generateTableData 方法*/
const generateSkus = (propertyList: any[]) => {
  skuListRef.value.generateTableData(propertyList)
}
</script>
