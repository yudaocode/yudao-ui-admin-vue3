<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="65%">
    <Form
      ref="formRef"
      v-loading="formLoading"
      :isCol="true"
      :rules="rules"
      :schema="allSchemas.formSchema"
    >
      <!-- 先选择 -->
      <template #spuId>
        <el-button @click="spuSelectRef.open()">选择商品</el-button>
        <SpuAndSkuList
          ref="spuAndSkuListRef"
          :deletable="true"
          :rule-config="ruleConfig"
          :spu-list="spuList"
          :spu-property-list-p="spuPropertyList"
          @delete="deleteSpu"
        >
          <el-table-column align="center" label="优惠金额" min-width="168">
            <template #default="{ row }">
              <el-input-number
                v-model="row.productConfig.discountPrice"
                :max="parseFloat(fenToYuan(row.price))"
                :min="0"
                :precision="2"
                :step="0.1"
                class="w-100%"
                @change="handleSkuDiscountPriceChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column align="center" label="折扣百分比(%)" min-width="168">
            <template #default="{ row }">
              <el-input-number
                v-model="row.productConfig.discountPercent"
                :max="100"
                :min="0"
                :precision="2"
                :step="0.1"
                class="w-100%"
                @change="handleSkuDiscountPercentChange(row)"
              />
            </template>
          </el-table-column>
        </SpuAndSkuList>
      </template>
    </Form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <SpuSelect ref="spuSelectRef" :isSelectSku="true" @confirm="selectSpu" />
</template>
<script lang="ts" setup>
import { SpuAndSkuList, SpuProperty, SpuSelect } from '../components'
import { allSchemas, rules } from './discountActivity.data'
import { cloneDeep, debounce } from 'lodash-es'
import * as DiscountActivityApi from '@/api/mall/promotion/discount/discountActivity'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'
import { convertToInteger, erpCalculatePercentage, fenToYuan, yuanToFen } from '@/utils'
import { PromotionDiscountTypeEnum } from '@/utils/constants'

defineOptions({ name: 'PromotionDiscountActivityForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
// ================= 商品选择相关 =================

const spuSelectRef = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 限时折扣  配置组件Ref
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.discountPrice',
    rule: (arg) => arg > 0,
    message: '商品优惠金额不能为 0 ！！！'
  }
]
const spuList = ref<DiscountActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<DiscountActivityApi.SpuExtension>[]>([])
const spuIds = ref<number[]>([])
const selectSpu = (spuId: number, skuIds: number[]) => {
  // TODO puhui999: 艿艿现在限时折扣活动可以选择多个 spu ，那么 spuId 是不是得改成 spuIds 来存放多个？🤣
  // TODO @puhui999：DiscountActivityDO 不存 spuId，在 DiscountProductDO 存储哈。
  formRef.value.setValues({ spuId })
  getSpuDetails(spuId, skuIds)
}
/**
 * 获取 SPU 详情
 */
const getSpuDetails = async (
  spuId: number,
  skuIds: number[] | undefined,
  products?: DiscountActivityApi.DiscountProductVO[],
  type?: string
) => {
  // 如果已经包含 SPU 则跳过
  if (spuIds.value.includes(spuId)) {
    if (type !== 'load') {
      message.error('数据重复选择！')
    }
    return
  }
  spuIds.value.push(spuId)
  const res = (await ProductSpuApi.getSpuDetailList([spuId])) as DiscountActivityApi.SpuExtension[]
  if (res.length == 0) {
    return
  }
  //spuList.value = []
  // 因为只能选择一个
  const spu = res[0]
  const selectSkus =
    typeof skuIds === 'undefined' ? spu?.skus : spu?.skus?.filter((sku) => skuIds.includes(sku.id!))
  selectSkus?.forEach((sku) => {
    let config: DiscountActivityApi.DiscountProductVO = {
      skuId: sku.id!,
      spuId: spu.id!,
      discountType: 1,
      discountPercent: 0,
      discountPrice: 0
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      if (product) {
        product.discountPercent = fenToYuan(product.discountPercent) as any
        product.discountPrice = fenToYuan(product.discountPrice) as any
      }
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as DiscountActivityApi.SkuExtension[]
  spuPropertyList.value.push({
    spuId: spu.id!,
    spuDetail: spu,
    propertyList: getPropertyList(spu)
  })
  spuList.value.push(spu)
}

// ================= end =================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  await resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = (await DiscountActivityApi.getDiscountActivity(
        id
      )) as DiscountActivityApi.DiscountActivityVO
      for (let productsKey in data.products) {
        const supId = data.products[productsKey].spuId
        await getSpuDetails(
          supId!,
          data.products?.map((sku) => sku.skuId),
          data.products,
          'load'
        )
      }
      formRef.value.setValues(data)
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
  const valid = await formRef.value.getElFormRef().validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    // 获取折扣商品配置
    const products = cloneDeep(spuAndSkuListRef.value.getSkuConfigs('productConfig'))
    products.forEach((item: DiscountActivityApi.DiscountProductVO) => {
      item.discountPercent = convertToInteger(item.discountPercent)
      item.discountPrice = convertToInteger(item.discountPrice)
    })
    const data = cloneDeep(formRef.value.formModel) as DiscountActivityApi.DiscountActivityVO
    data.products = products
    // 真正提交
    if (formType.value === 'create') {
      await DiscountActivityApi.createDiscountActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await DiscountActivityApi.updateDiscountActivity(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 处理 sku 优惠金额变动 */
const handleSkuDiscountPriceChange = debounce((row: any) => {
  // 校验边界
  if (row.productConfig.discountPrice <= 0) {
    return
  }

  // 设置优惠类型：满减
  row.productConfig.discountType = PromotionDiscountTypeEnum.PRICE.type
  // 设置折扣
  row.productConfig.discountPercent = erpCalculatePercentage(
    row.price - yuanToFen(row.productConfig.discountPrice),
    row.price
  )
}, 200)
/** 处理 sku 优惠折扣变动 */
const handleSkuDiscountPercentChange = debounce((row: any) => {
  // 校验边界
  if (row.productConfig.discountPercent <= 0 || row.productConfig.discountPercent >= 100) {
    return
  }

  // 设置优惠类型：折扣
  row.productConfig.discountType = PromotionDiscountTypeEnum.PERCENT.type
  // 设置满减金额
  row.productConfig.discountPrice = fenToYuan(
    row.price - row.price * (row.productConfig.discountPercent / 100.0 || 0)
  )
}, 200)

/** 重置表单 */
const resetForm = async () => {
  spuList.value = []
  spuPropertyList.value = []
  spuIds.value = []
  await nextTick()
  formRef.value.getElFormRef().resetFields()
}

/**
 * 删除 SPU
 */
const deleteSpu = (spuId: number) => {
  spuIds.value.splice(
    spuIds.value.findIndex((item) => item == spuId),
    1
  )
  spuPropertyList.value.splice(
    spuPropertyList.value.findIndex((item) => item.spuId == spuId),
    1
  )
}
</script>
