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
      <!-- TODO @zhangshuai：商品允许选择多个 -->
      <!-- TODO @zhangshuai：选择后的 SKU，需要后面加个【删除】按钮 -->
      <!-- TODO @zhangshuai：展示的金额，貌似不对，大了 100 倍，需要看下 -->
      <!-- TODO @zhangshuai：“优惠类型”，是每个 SKU 可以自定义已设置哈。因为每个商品 SKU 的折扣和减少价格，可能不同。具体交互，可以注册一个 youzan.com 看看；它的交互方式是，如果设置了“优惠金额”，则算“减价”；如果再次设置了“折扣百分比”，就算“打折”；这样形成一个互斥的优惠类型 -->
      <template #spuId>
        <el-button @click="spuSelectRef.open()">选择商品</el-button>
        <SpuAndSkuList
          ref="spuAndSkuListRef"
          :rule-config="ruleConfig"
          :spu-list="spuList"
          :spu-property-list-p="spuPropertyList"
        >
          <el-table-column align="center" label="优惠金额" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number v-model="sku.productConfig.discountPrice" :min="0" class="w-100%" />
            </template>
          </el-table-column>
          <el-table-column align="center" label="折扣百分比(%)" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number v-model="sku.productConfig.discountPercent" class="w-100%" />
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
import { cloneDeep } from 'lodash-es'
import * as DiscountActivityApi from '@/api/mall/promotion/discount/discountActivity'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'

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
const ruleConfig: RuleConfig[] = []
const spuList = ref<DiscountActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<DiscountActivityApi.SpuExtension>[]>([])
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
  products?: DiscountActivityApi.DiscountProductVO[]
) => {
  const spuProperties: SpuProperty<DiscountActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList([spuId])) as DiscountActivityApi.SpuExtension[]
  if (res.length == 0) {
    return
  }
  spuList.value = []
  // 因为只能选择一个
  const spu = res[0]
  const selectSkus =
    typeof skuIds === 'undefined' ? spu?.skus : spu?.skus?.filter((sku) => skuIds.includes(sku.id!))
  selectSkus?.forEach((sku) => {
    let config: DiscountActivityApi.DiscountProductVO = {
      skuId: sku.id!,
      spuId: spu.id,
      discountType: 1,
      discountPercent: 0,
      discountPrice: 0
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as DiscountActivityApi.SkuExtension[]
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
      const data = (await DiscountActivityApi.getDiscountActivity(
        id
      )) as DiscountActivityApi.DiscountActivityVO
      const supId = data.products[0].spuId
      await getSpuDetails(supId!, data.products?.map((sku) => sku.skuId), data.products)
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
    const data = formRef.value.formModel as DiscountActivityApi.DiscountActivityVO
    // 获取 折扣商品配置
    const products = cloneDeep(spuAndSkuListRef.value.getSkuConfigs('productConfig'))
    products.forEach((item: DiscountActivityApi.DiscountProductVO) => {
      item.discountType = data['discountType']
    })
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

/** 重置表单 */
const resetForm = async () => {
  spuList.value = []
  spuPropertyList.value = []
  await nextTick()
  formRef.value.getElFormRef().resetFields()
}
</script>
