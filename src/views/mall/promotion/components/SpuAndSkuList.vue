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
            <slot></slot>
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
import { formatToFraction } from '@/utils'
import { createImageViewer } from '@/components/ImageViewer'
import { Spu } from '@/api/mall/product/spu'
import { RuleConfig, SkuList } from '@/views/mall/product/spu/components'
import { SpuProperty } from '@/views/mall/promotion/components/index'

defineOptions({ name: 'PromotionSpuAndSkuList' })

const props = defineProps<{
  spuList: T[] // TODO 为了方便兼容后续可能有需要展示多个 spu 的情况暂时保持，如果后续都是只操作一个 spu 的话则可更改为接受一个 spu 或保持
  ruleConfig: RuleConfig[]
  spuPropertyListP: SpuProperty<T>[]
}>()

const spuData = ref<Spu[]>([]) // spu 详情数据列表
const skuListRef = ref() // 商品属性列表Ref

const spuPropertyList = ref<SpuProperty<T>[]>([]) // spuId 对应的 sku 的属性列表

/**
 * 获取所有 sku 活动配置
 * @param extendedAttribute 在 sku 上扩展的属性，例：秒杀活动 sku 扩展属性 productConfig 请参考 seckillActivity.ts
 */
const getSkuConfigs = (extendedAttribute: string) => {
  skuListRef.value.validateSku()
  const seckillProducts = []
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
