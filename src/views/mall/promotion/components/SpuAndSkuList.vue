<template>
  <el-table :data="spuData" :expand-row-keys="expandRowKeys" row-key="id">
    <el-table-column type="expand" width="30">
      <template #default="{ row }">
        <SkuList
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
        <el-image :src="row.picUrl" class="h-30px w-30px" @click="imagePreview(row.picUrl)" />
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
    <el-table-column
      v-if="spuData.length > 1 && deletable"
      align="center"
      label="操作"
      min-width="90"
    >
      <template #default="scope">
        <el-button link type="primary" @click="deleteSpu(scope.row.id)"> 删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
<script generic="T extends Spu" lang="ts" setup>
import { get } from 'lodash-es'
import { formatToFraction } from '@/utils'
import { isEmpty } from '@/utils/is'
import { createImageViewer } from '@/components/ImageViewer'
import { Spu } from '@/api/mall/product/spu'
import { RuleConfig, SkuList } from '@/views/mall/product/spu/components'
import { SpuProperty } from '@/views/mall/promotion/components/index'

defineOptions({ name: 'PromotionSpuAndSkuList' })

const message = useMessage() // 消息弹窗

const props = defineProps<{
  spuList: T[]
  ruleConfig: RuleConfig[]
  spuPropertyListP: SpuProperty<T>[]
  deletable?: boolean // SPU 是否可删除；
}>()

const spuData = ref<Spu[]>([]) // spu 详情数据列表
const spuPropertyList = ref<SpuProperty<T>[]>([]) // spuId 对应的 sku 的属性列表
const expandRowKeys = ref<string[]>([]) // 控制展开行需要设置 row-key 属性才能使用，该属性为展开行的 keys 数组。

/**
 * 校验全部 spu 的属性值和 sku 活动配置，规则同 SkuList 的 validateSku
 *
 * 直接遍历 spuPropertyList，不依赖展开行里挂载的 SkuList，折叠、删除行后仍校验全部商品
 */
const validateSkus = () => {
  for (const item of spuPropertyList.value) {
    // 校验商品属性属性值是否为空，有一个为空都不给过
    if (item.propertyList?.some((property) => !property.values || isEmpty(property.values))) {
      const warningInfo = '存在属性属性值为空，请先检查完善属性值后重试！！！'
      message.warning(warningInfo)
      throw new Error(warningInfo)
    }
    for (const sku of item.spuDetail.skus ?? []) {
      const failedRule = props.ruleConfig.find((rule) => !rule.rule(get(sku, rule.name)))
      if (failedRule) {
        const warningInfo = '请检查商品各行相关属性配置，' + failedRule.message
        message.warning(warningInfo)
        throw new Error(warningInfo)
      }
    }
  }
}

/**
 * 获取所有 sku 活动配置
 *
 * @param extendedAttribute 在 sku 上扩展的属性，例：秒杀活动 sku 扩展属性 productConfig 请参考 seckillActivity.ts
 */
const getSkuConfigs = (extendedAttribute: string) => {
  validateSkus()
  const seckillProducts: any[] = []
  spuPropertyList.value.forEach((item) => {
    item.spuDetail.skus?.forEach((sku: any) => {
      seckillProducts.push(sku[extendedAttribute] as any)
    })
  })
  // 没有任何 sku（未选商品或商品详情尚未加载完成）时拒绝提交，不能提交空商品
  if (seckillProducts.length === 0) {
    const warningInfo = '请选择商品'
    message.warning(warningInfo)
    throw new Error(warningInfo)
  }
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

// 删除时的触发事件
const emits = defineEmits<{
  (e: 'delete', spuId: number): void
}>()

/** 多选时可以删除 SPU **/
const deleteSpu = async (spuId: number) => {
  await message.confirm('是否删除商品编号为' + spuId + '的数据？')
  const index = spuData.value.findIndex((item) => item.id == spuId)
  spuData.value.splice(index, 1)
  emits('delete', spuId)
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
    spuPropertyList.value = data as SpuProperty<T>[] as any
    // 解决如果之前选择的是单规格 spu 的话后面选择多规格 sku 多规格属性信息不展示的问题。解决方法：让 SkuList 组件重新渲染（行折叠会干掉包含的组件展开时会重新加载）
    setTimeout(() => {
      expandRowKeys.value = data.map((item) => item.spuId + '')
    }, 200)
  },
  {
    deep: true,
    immediate: true
  }
)
</script>
