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
      <!--  根据商品属性动态添加  -->
      <el-table-column
        v-for="(item, index) in tableHeaders"
        :key="index"
        :label="item.label"
        align="center"
        min-width="120"
      >
        <template #default="{ row }">
          {{ row.properties[index]?.valueName }}
        </template>
      </el-table-column>
    </template>
    <!-- TODO @puhui999： controls-position=" " 可以去掉哈，不然太长了，手动输入更方便 -->
    <el-table-column align="center" label="商品条码" min-width="168">
      <template #default="{ row }">
        <el-input v-model="row.barCode" class="w-100%" />
      </template>
    </el-table-column>
    <!-- TODO @puhui999：用户输入的时候，是按照元；分主要是我们自己用； -->
    <el-table-column align="center" label="销售价(元)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.price" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="市场价(元)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.marketPrice" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="成本价(元)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.costPrice" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="库存" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.stock" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="重量(kg)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.weight" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="体积(m^3)" min-width="168">
      <template #default="{ row }">
        <el-input-number v-model="row.volume" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <template v-if="formData.subCommissionType">
      <el-table-column align="center" label="一级返佣(元)" min-width="168">
        <template #default="{ row }">
          <el-input-number v-model="row.subCommissionFirstPrice" :min="0" class="w-100%" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="二级返佣(元)" min-width="168">
        <template #default="{ row }">
          <el-input-number v-model="row.subCommissionSecondPrice" :min="0" class="w-100%" />
        </template>
      </el-table-column>
    </template>
    <el-table-column v-if="formData.specType" align="center" fixed="right" label="操作" width="80">
      <template #default>
        <el-button v-if="isBatch" link size="small" type="primary" @click="batchAdd">
          批量添加
        </el-button>
        <el-button v-else link size="small" type="primary">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
<script lang="ts" name="SkuList" setup>
import { UploadImg } from '@/components/UploadFile'
import { PropType } from 'vue'
import type { Property, SkuType, SpuType } from '@/api/mall/product/spu'
import { propTypes } from '@/utils/propTypes'
import { copyValueToTarget } from '@/utils'

const props = defineProps({
  propFormData: {
    type: Object as PropType<SpuType>,
    default: () => {}
  },
  attributeList: {
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

/** 批量添加 */
const batchAdd = () => {
  formData.value.skus.forEach((item) => {
    copyValueToTarget(item, skuList.value[0])
  })
}

const tableHeaders = ref<{ prop: string; label: string }[]>([]) // 多属性表头

/**
 * 将传进来的值赋值给skuList
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

// TODO @芋艿：看看 chatgpt 可以进一步下面几个方法的实现不
/** 生成表数据 */
const generateTableData = (data: any[]) => {
  // 构建数据结构 fix: 使用map替换多重for循环
  const propertiesItemList = data.map((item) =>
    item.values.map((v) => ({
      propertyId: item.id,
      propertyName: item.name,
      valueId: v.id,
      valueName: v.name
    }))
  )
  const buildList = build(propertiesItemList)
  // 如果构建后的组合数跟sku数量一样的话则不用处理,添加新属性没有属性值也不做处理
  // fix: 解决编辑表单时或查看详情时数据回显问题
  if (
    buildList.length === formData.value.skus.length ||
    data.some((item) => item.values.length === 0)
  ) {
    return
  }
  // 重置表数据
  formData.value!.skus = []
  buildList.forEach((item) => {
    const row = {
      properties: Array.isArray(item) ? item : [item],
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
    formData.value.skus.push(row)
  })
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

/** 监听属性列表生成相关参数和表头 */
watch(
  () => props.attributeList,
  (attributeList) => {
    // 如果不是多规格则结束
    if (!formData.value.specType) return
    // 如果当前组件作为批量添加数据使用则重置表数据
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
    if (JSON.stringify(attributeList) === '[]') return
    // 重置表头
    tableHeaders.value = []
    // 生成表头
    attributeList.forEach((item, index) => {
      // name加属性项index区分属性值
      tableHeaders.value.push({ prop: `name${index}`, label: item.name })
    })
    generateTableData(attributeList)
  },
  {
    deep: true,
    immediate: true
  }
)
</script>
