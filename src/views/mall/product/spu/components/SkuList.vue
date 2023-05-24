<template>
  <el-table
    :data="isBatch ? skuList : formData.skus"
    border
    class="tabNumWidth"
    max-height="500"
    size="small"
  >
    <el-table-column align="center" fixed="left" label="图片" min-width="100">
      <template #default="{ row }">
        <UploadImg v-model="row.picUrl" height="80px" width="100%" />
      </template>
    </el-table-column>
    <template v-if="formData.specType && !isBatch">
      <!--  根据商品属性动态添加 -->
      <el-table-column
        v-for="(item, index) in tableHeaders"
        :key="index"
        :label="item.label"
        align="center"
        min-width="120"
      >
        <template #default="{ row }">
          <!-- TODO puhui999：展示成蓝色，有点区分度哈 -->
          {{ row.properties[index]?.valueName }}
        </template>
      </el-table-column>
    </template>
    <el-table-column align="center" label="商品条码" min-width="168">
      <template #default="{ row }">
        <el-input v-model="row.barCode" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="销售价(元)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.price" :min="0" :precision="2" :step="0.1" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="市场价(元)" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.marketPrice"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="成本价(元)" min-width="168">
      <template #default="{ row }">
        <el-input-number
          v-model="row.costPrice"
          :min="0"
          :precision="2"
          :step="0.1"
          class="w-100%"
        />
      </template>
    </el-table-column>
    <el-table-column align="center" label="库存" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.stock" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="重量(kg)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.weight" :min="0" :precision="2" :step="0.1" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="体积(m^3)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.volume" :min="0" :precision="2" :step="0.1" class="w-100%" />
      </template>
    </el-table-column>
    <template v-if="formData.subCommissionType">
      <el-table-column align="center" label="一级返佣(元)" min-width="168">
        <template #default="{ row }">
          <el-input-number
            v-model="row.subCommissionFirstPrice"
            :min="0"
            :precision="2"
            :step="0.1"
            class="w-100%"
          />
        </template>
      </el-table-column>
      <el-table-column align="center" label="二级返佣(元)" min-width="168">
        <template #default="{ row }">
          <el-input-number
            v-model="row.subCommissionSecondPrice"
            :min="0"
            :precision="2"
            :step="0.1"
            class="w-100%"
          />
        </template>
      </el-table-column>
    </template>
    <el-table-column v-if="formData.specType" align="center" fixed="right" label="操作" width="80">
      <template #default="{ row }">
        <el-button v-if="isBatch" link size="small" type="primary" @click="batchAdd">
          批量添加
        </el-button>
        <el-button v-else link size="small" type="primary" @click="deleteSku(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
<script lang="ts" name="SkuList" setup>
import { PropType } from 'vue'
import { copyValueToTarget } from '@/utils'
import { propTypes } from '@/utils/propTypes'
import { UploadImg } from '@/components/UploadFile'
import type { Property, SkuType, SpuType } from '@/api/mall/product/spu'

const props = defineProps({
  propFormData: {
    type: Object as PropType<SpuType>,
    default: () => {}
  },
  propertyList: {
    type: Array,
    default: () => []
  },
  isBatch: propTypes.bool.def(false) // 是否作为批量操作组件
})
const formData = ref<SpuType>() // 表单数据
const skuList = ref<SkuType[]>([
  {
    price: 0, // 商品价格
    marketPrice: 0, // 市场价
    costPrice: 0, // 成本价
    barCode: '', // 商品条码
    picUrl: '', // 图片地址
    stock: 0, // 库存
    weight: 0, // 商品重量
    volume: 0, // 商品体积
    subCommissionFirstPrice: 0, // 一级分销的佣金
    subCommissionSecondPrice: 0 // 二级分销的佣金
  }
]) // 批量添加时的临时数据
// TODO @puhui999：保存时，每个商品规格的表单要校验下。例如说，销售金额最低是 0.01 这种。

/** 批量添加 */
const batchAdd = () => {
  formData.value.skus.forEach((item) => {
    copyValueToTarget(item, skuList.value[0])
  })
}

/** 删除 sku */
const deleteSku = (row) => {
  const index = formData.value.skus.findIndex(
    // 直接把列表转成字符串比较
    (sku) => JSON.stringify(sku.properties) === JSON.stringify(row.properties)
  )
  formData.value.skus.splice(index, 1)
}
const tableHeaders = ref<{ prop: string; label: string }[]>([]) // 多属性表头

/**
 * 将传进来的值赋值给 skuList
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return
    formData.value = data
  },
  {
    deep: true,
    immediate: true
  }
)

/** 生成表数据 */
const generateTableData = (propertyList: any[]) => {
  // 构建数据结构
  const propertyValues = propertyList.map((item) =>
    item.values.map((v) => ({
      propertyId: item.id,
      propertyName: item.name,
      valueId: v.id,
      valueName: v.name
    }))
  )
  // TODO @puhui：是不是 buildSkuList，这样容易理解一点哈。item 改成 sku
  const buildList = build(propertyValues)
  // 如果回显的 sku 属性和添加的属性不一致则重置 skus 列表
  if (!validateData(propertyList)) {
    // 如果不一致则重置表数据，默认添加新的属性重新生成 sku 列表
    formData.value!.skus = []
  }
  for (const item of buildList) {
    const row = {
      properties: Array.isArray(item) ? item : [item], // 如果只有一个属性的话返回的是一个 property 对象
      price: 0,
      marketPrice: 0,
      costPrice: 0,
      barCode: '',
      picUrl: '',
      stock: 0,
      weight: 0,
      volume: 0,
      subCommissionFirstPrice: 0,
      subCommissionSecondPrice: 0
    }
    // 如果存在属性相同的 sku 则不做处理
    const index = formData.value!.skus.findIndex(
      (sku) => JSON.stringify(sku.properties) === JSON.stringify(row.properties)
    )
    if (index !== -1) {
      continue
    }
    formData.value.skus.push(row)
  }
}

/**
 * 生成 skus 前置校验
 */
const validateData = (propertyList: any[]) => {
  const skuPropertyIds = []
  formData.value.skus.forEach((sku) =>
    sku.properties
      ?.map((property) => property.propertyId)
      .forEach((propertyId) => {
        if (skuPropertyIds.indexOf(propertyId) === -1) {
          skuPropertyIds.push(propertyId)
        }
      })
  )
  const propertyIds = propertyList.map((item) => item.id)
  return skuPropertyIds.length === propertyIds.length
}

/** 构建所有排列组合 */
const build = (propertyValuesList: Property[][]) => {
  if (propertyValuesList.length === 0) {
    return []
  } else if (propertyValuesList.length === 1) {
    return propertyValuesList[0]
  } else {
    const result: Property[][] = []
    const rest = build(propertyValuesList.slice(1))
    for (let i = 0; i < propertyValuesList[0].length; i++) {
      for (let j = 0; j < rest.length; j++) {
        // 第一次不是数组结构，后面的都是数组结构
        if (Array.isArray(rest[j])) {
          result.push([propertyValuesList[0][i], ...rest[j]])
        } else {
          result.push([propertyValuesList[0][i], rest[j]])
        }
      }
    }
    return result
  }
}

/** 监听属性列表，生成相关参数和表头 */
watch(
  () => props.propertyList,
  (propertyList) => {
    // 如果不是多规格则结束
    if (!formData.value.specType) {
      return
    }
    // 如果当前组件作为批量添加数据使用，则重置表数据
    if (props.isBatch) {
      skuList.value = [
        {
          price: 0,
          marketPrice: 0,
          costPrice: 0,
          barCode: '',
          picUrl: '',
          stock: 0,
          weight: 0,
          volume: 0,
          subCommissionFirstPrice: 0,
          subCommissionSecondPrice: 0
        }
      ]
    }

    // 判断代理对象是否为空
    if (JSON.stringify(propertyList) === '[]') {
      return
    }
    // 重置表头
    tableHeaders.value = []
    // 生成表头
    propertyList.forEach((item, index) => {
      // name加属性项index区分属性值
      tableHeaders.value.push({ prop: `name${index}`, label: item.name })
    })

    // 如果回显的 sku 属性和添加的属性一致则不处理
    if (validateData(propertyList)) {
      return
    }
    // 添加新属性没有属性值也不做处理
    if (propertyList.some((item) => item.values.length === 0)) {
      return
    }
    // 生成 table 数据，即 sku 列表
    generateTableData(propertyList)
  },
  {
    deep: true,
    immediate: true
  }
)
// 暴露出生成 sku 方法，给添加属性成功时调用
defineExpose({ generateTableData })
</script>
