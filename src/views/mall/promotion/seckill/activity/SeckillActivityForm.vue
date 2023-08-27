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
          :rule-config="ruleConfig"
          :spu-list="spuList"
          :spu-property-list-p="spuPropertyList"
        >
          <el-table-column align="center" label="秒杀库存" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number v-model="sku.productConfig.stock" :min="0" class="w-100%" />
            </template>
          </el-table-column>
          <el-table-column align="center" label="秒杀价格(元)" min-width="168">
            <template #default="{ row: sku }">
              <el-input-number
                v-model="sku.productConfig.seckillPrice"
                :min="0"
                :precision="2"
                :step="0.1"
                class="w-100%"
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
import { SpuAndSkuList, SpuProperty, SpuSelect } from '../../components'
import { allSchemas, rules } from './seckillActivity.data'
import { cloneDeep } from 'lodash-es'

import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'
import { SeckillProductVO } from '@/api/mall/promotion/seckill/seckillActivity'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'
import { convertToInteger, formatToFraction } from '@/utils'

defineOptions({ name: 'PromotionSeckillActivityForm' })

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
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.stock',
    rule: (arg) => arg >= 1,
    message: '商品秒杀库存必须大于等于 1 ！！！'
  },
  {
    name: 'productConfig.seckillPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品秒杀价格必须大于等于 0.01 ！！！'
  }
]
const spuList = ref<SeckillActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<SeckillActivityApi.SpuExtension>[]>([])
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
  products?: SeckillProductVO[]
) => {
  const spuProperties: SpuProperty<SeckillActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList([spuId])) as SeckillActivityApi.SpuExtension[]
  if (res.length == 0) {
    return
  }
  spuList.value = []
  // 因为只能选择一个
  const spu = res[0]
  const selectSkus =
    typeof skuIds === 'undefined' ? spu?.skus : spu?.skus?.filter((sku) => skuIds.includes(sku.id!))
  selectSkus?.forEach((sku) => {
    let config: SeckillActivityApi.SeckillProductVO = {
      skuId: sku.id!,
      stock: 0,
      seckillPrice: 0
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      if (product) {
        product.seckillPrice = formatToFraction(product.seckillPrice)
      }
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as SeckillActivityApi.SkuExtension[]
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
      const data = (await SeckillActivityApi.getSeckillActivity(
        id
      )) as SeckillActivityApi.SeckillActivityVO
      await getSpuDetails(data.spuId!, data.products?.map((sku) => sku.skuId), data.products)
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
    // 获取秒杀商品配置
    const products = cloneDeep(spuAndSkuListRef.value.getSkuConfigs('productConfig'))
    products.forEach((item: SeckillProductVO) => {
      item.seckillPrice = convertToInteger(item.seckillPrice)
    })
    const data = formRef.value.formModel as SeckillActivityApi.SeckillActivityVO
    data.products = products
    // 真正提交
    if (formType.value === 'create') {
      await SeckillActivityApi.createSeckillActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await SeckillActivityApi.updateSeckillActivity(data)
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
