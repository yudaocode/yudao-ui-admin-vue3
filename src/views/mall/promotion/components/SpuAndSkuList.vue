<template>
  <el-table :data="spuData" :default-expand-all="true">
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
<script generic="T extends Spu" lang="ts" setup>
// TODO 后续计划重新封装作为活动商品配置通用组件；可以等其他活动做到的时候，在统一处理 SPU 选择组件哈
import { formatToFraction } from '@/utils'
import { createImageViewer } from '@/components/ImageViewer'
import { Spu } from '@/api/mall/product/spu'
import { RuleConfig, SkuList } from '@/views/mall/product/spu/components'
import { SeckillProductVO } from '@/api/mall/promotion/seckill/seckillActivity'
import { SpuProperty } from '@/views/mall/promotion/components/index'

defineOptions({ name: 'PromotionSpuAndSkuList' })

// TODO @puhui999：是不是改成传递一个 spu 就好啦？ 因为活动商品可以多选所以展示编辑的时候需要展示多个
const props = defineProps<{
  spuList: T[]
  ruleConfig: RuleConfig[]
  spuPropertyListP: SpuProperty<T>[]
}>()

const spuData = ref<Spu[]>([]) // spu 详情数据列表
const skuListRef = ref() // 商品属性列表Ref

const spuPropertyList = ref<SpuProperty<T>[]>([]) // spuId 对应的 sku 的属性列表

/**
 * 获取所有 sku 秒杀配置
 * @param extendedAttribute 在 sku 上扩展的属性，例：秒杀活动 sku 扩展属性 productConfig 请参考 seckillActivity.ts
 */
const getSkuConfigs: <V>(extendedAttribute: string) => V[] = (extendedAttribute: string) => {
  skuListRef.value.validateSku()
  const seckillProducts: SeckillProductVO[] = []
  spuPropertyList.value.forEach((item) => {
    item.spuDetail.skus.forEach((sku) => {
      seckillProducts.push(sku[extendedAttribute])
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
    spuData.value = data as Spu[]
  },
  {
    deep: true,
    immediate: true
  }
)
/**
 * 将传进来的值赋值给 skuList
 */
watch(
  () => props.spuPropertyListP,
  (data) => {
    if (!data) return
    spuPropertyList.value = data as SpuProperty<T>[]
  },
  {
    deep: true,
    immediate: true
  }
)
</script>
