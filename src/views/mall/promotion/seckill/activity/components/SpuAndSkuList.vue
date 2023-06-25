<template>
  <el-table :data="spuData">
    <el-table-column type="expand" width="30">
      <template #default="{ row }">
        <SkuList
          ref="skuListRef"
          :is-activity-component="true"
          :prop-form-data="spuPropertyList.find((item) => item.spuId === row.id)?.spuDetail"
          :property-list="spuPropertyList.find((item) => item.spuId === row.id)?.propertyList"
          :rule-config="ruleConfig"
        >
          <template #extension>
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
          </template>
        </SkuList>
      </template>
    </el-table-column>
    <el-table-column key="id" align="center" label="商品编号" prop="id" />
    <el-table-column label="商品图" min-width="80">
      <template #default="{ row }">
        <el-image :src="row.picUrl" class="w-30px h-30px" @click="imagePreview(row.picUrl)" />
      </template>
    </el-table-column>
    <el-table-column :show-overflow-tooltip="true" label="商品名称" min-width="300" prop="name" />
    <el-table-column align="center" label="商品售价" min-width="90" prop="price">
      <template #default="{ row }">
        {{ formatToFraction(row.price) }}
      </template>
    </el-table-column>
    <el-table-column align="center" label="销量" min-width="90" prop="salesCount" />
    <el-table-column align="center" label="库存" min-width="90" prop="stock" />
  </el-table>
</template>
<script lang="ts" setup>
// TODO 后续计划重新封装作为活动商品配置通用组件；可以等其他活动做到的时候，在统一处理 SPU 选择组件哈
import { formatToFraction } from '@/utils'
import { createImageViewer } from '@/components/ImageViewer'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { SpuRespVO } from '@/api/mall/product/spu'
import {
  getPropertyList,
  Properties,
  RuleConfig,
  SkuList
} from '@/views/mall/product/spu/components'
import { SeckillProductVO, SpuExtension } from '@/api/mall/promotion/seckill/seckillActivity'

defineOptions({ name: 'PromotionSpuAndSkuList' })

const message = useMessage() // 消息弹窗

// TODO @puhui999：是不是改成传递一个 spu 就好啦？
const props = defineProps({
  spuList: {
    type: Array,
    default: () => []
  }
})
const spuData = ref<SpuRespVO[]>([]) // spu 详情数据列表
const skuListRef = ref() // 商品属性列表Ref
interface spuProperty {
  spuId: number
  spuDetail: SpuExtension
  propertyList: Properties[]
} // TODO @puhui999：类名首字母大写哈

const spuPropertyList = ref<spuProperty[]>([]) // spuId 对应的 sku 的属性列表
/**
 * 获取 SPU 详情
 * @param spuIds
 */
const getSpuDetails = async (spuIds: number[]) => {
  const spuProperties: spuProperty[] = []
  // TODO puhui999: 考虑后端添加通过 spuIds 批量获取
  for (const spuId of spuIds) {
    // 获取 SPU 详情
    const res = (await ProductSpuApi.getSpu(spuId)) as SpuExtension
    if (!res) {
      continue
    }
    // 初始化每个 sku 秒杀配置
    res.skus?.forEach((sku) => {
      const config: SeckillProductVO = {
        spuId,
        skuId: sku.id!,
        stock: 0,
        seckillPrice: 0
      }
      sku.productConfig = config
    })
    spuProperties.push({ spuId, spuDetail: res, propertyList: getPropertyList(res) })
  }
  spuPropertyList.value = spuProperties
}
const ruleConfig: RuleConfig[] = [
  {
    name: 'stock',
    geValue: 10
  },
  {
    name: 'seckillPrice',
    geValue: 0.01
  }
]
/**
 * 获取所有 sku 秒杀配置
 */
const getSkuConfigs = (): SeckillProductVO[] => {
  if (!skuListRef.value.validateSku()) {
    // TODO 作为通用组件是需要进一步完善
    message.warning('请检查商品相关属性配置！！')
    throw new Error('请检查商品相关属性配置！！')
  }
  const seckillProducts: SeckillProductVO[] = []
  spuPropertyList.value.forEach((item) => {
    item.spuDetail.skus.forEach((sku) => {
      seckillProducts.push(sku.productConfig)
    })
  })
  return seckillProducts
}
// 暴露出给表单提交时使用
defineExpose({ getSkuConfigs })

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    zIndex: 99999999,
    urlList: [imgUrl]
  })
}

/**
 * 将传进来的值赋值给 skuList
 */
watch(
  () => props.spuList,
  (data) => {
    if (!data) return
    spuData.value = data as SpuRespVO[]
    getSpuDetails(spuData.value.map((spu) => spu.id!))
  },
  {
    deep: true,
    immediate: true
  }
)
</script>
