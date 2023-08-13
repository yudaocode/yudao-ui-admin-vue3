<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="65%">
    <Form
      ref="formRef"
      v-loading="formLoading"
      :is-col="true"
      :rules="rules"
      :schema="allSchemas.formSchema"
      class="mt-10px"
    >
      <template #spuId>
        <el-button @click="spuSelectRef.open()">选择商品</el-button>
        <SpuAndSkuList
          ref="spuAndSkuListRef"
          :rule-config="ruleConfig"
          :spu-list="spuList"
          :spu-property-list-p="spuPropertyList"
        >
          <el-table-column align="center" label="砍价起始价格(元)" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number
                v-model="sku.productConfig.bargainFirstPrice"
                :min="0"
                :precision="2"
                :step="0.1"
                class="w-100%"
              />
            </template>
          </el-table-column>
          <el-table-column align="center" label="砍价底价(元)" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number
                v-model="sku.productConfig.bargainPrice"
                :min="0"
                :precision="2"
                :step="0.1"
                class="w-100%"
              />
            </template>
          </el-table-column>
          <el-table-column align="center" label="活动库存" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number v-model="sku.productConfig.stock" class="w-100%" />
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
import * as BargainActivityApi from '@/api/mall/promotion/bargain/bargainActivity'
import { BargainProductVO } from '@/api/mall/promotion/bargain/bargainActivity'
import { allSchemas, rules } from './bargainActivity.data'
import { SpuAndSkuList, SpuProperty, SpuSelect } from '@/views/mall/promotion/components'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { convertToInteger, formatToFraction } from '@/utils'

defineOptions({ name: 'PromotionBargainActivityForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref

// ================= 商品选择相关 =================

const spuSelectRef = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 秒杀配置组件Ref
const spuList = ref<BargainActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<BargainActivityApi.SpuExtension>[]>([])
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.bargainFirstPrice',
    rule: (arg) => arg > 0,
    message: '商品砍价起始价格不能小于0 ！！！'
  },
  {
    name: 'productConfig.bargainPrice',
    rule: (arg) => arg > 0,
    message: '商品砍价底价不能小于0 ！！！'
  },
  {
    name: 'productConfig.stock',
    rule: (arg) => arg > 1,
    message: '商品活动库存不能小于1 ！！！'
  }
]
const selectSpu = (spuId: number, skuIds: number[]) => {
  formRef.value.setValues({ spuId })
  getSpuDetails(spuId, skuIds)
}
/**
 * 获取 SPU 详情
 */
const getSpuDetails = async (
  spuId: number,
  skuIds: number[] | undefined,
  products?: BargainProductVO[]
) => {
  const spuProperties: SpuProperty<BargainActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList([spuId])) as BargainActivityApi.SpuExtension[]
  if (res.length == 0) {
    return
  }
  spuList.value = []
  // 因为只能选择一个
  const spu = res[0]
  const selectSkus =
    typeof skuIds === 'undefined' ? spu?.skus : spu?.skus?.filter((sku) => skuIds.includes(sku.id!))
  selectSkus?.forEach((sku) => {
    let config: BargainProductVO = {
      spuId: spu.id!,
      skuId: sku.id!,
      bargainFirstPrice: 1,
      bargainPrice: 1,
      stock: 1
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      if (product) {
        product.bargainFirstPrice = formatToFraction(product.bargainFirstPrice)
        product.bargainPrice = formatToFraction(product.bargainPrice)
      }
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as BargainActivityApi.SkuExtension[]
  spuProperties.push({
    spuId: spu.id!,
    spuDetail: spu,
    propertyList: getPropertyList(spu)
  })
  spuList.value.push(spu)
  spuPropertyList.value = spuProperties
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
      const data = (await BargainActivityApi.getBargainActivity(
        id
      )) as BargainActivityApi.BargainActivityVO
      // 用户每次砍价金额分转元, 分转元
      data.randomMinPrice = formatToFraction(data.randomMinPrice)
      data.randomMaxPrice = formatToFraction(data.randomMaxPrice)
      await getSpuDetails(data.spuId!, data.products?.map((sku) => sku.skuId), data.products)
      formRef.value.setValues(data)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 重置表单 */
const resetForm = async () => {
  spuList.value = []
  spuPropertyList.value = []
  await nextTick()
  formRef.value.getElFormRef().resetFields()
}

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
    const data = formRef.value.formModel as BargainActivityApi.BargainActivityVO
    const products = spuAndSkuListRef.value.getSkuConfigs('productConfig')
    products.forEach((item: BargainProductVO) => {
      // 砍价价格元转分
      item.bargainFirstPrice = convertToInteger(item.bargainFirstPrice)
      item.bargainPrice = convertToInteger(item.bargainPrice)
    })
    // 用户每次砍价金额分转元, 元转分
    data.randomMinPrice = convertToInteger(data.randomMinPrice)
    data.randomMaxPrice = convertToInteger(data.randomMaxPrice)
    data.products = products
    if (formType.value === 'create') {
      await BargainActivityApi.createBargainActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await BargainActivityApi.updateBargainActivity(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
