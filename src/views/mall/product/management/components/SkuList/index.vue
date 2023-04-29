<template>
  <el-table :data="isBatch ? SkuData : formData.skus" border class="tabNumWidth" size="small">
    <el-table-column align="center" fixed="left" label="图片" min-width="100">
      <template #default="{ row }">
        <UploadImg v-model="row.picUrl" height="80px" width="100%" />
      </template>
    </el-table-column>
    <template v-if="formData.specType">
      <!--  根据商品属性动态添加  -->
      <el-table-column
        v-for="(item, index) in tableHeaderList"
        :key="index"
        :label="item.label"
        :prop="item.prop"
        align="center"
        min-width="120"
      />
    </template>
    <el-table-column align="center" label="商品条码" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.barCode" :min="0" class="w-100%" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="销售价(分)" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.price" :min="0" class="w-100%" type="number" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="市场价(分)" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.marketPrice" :min="0" class="w-100%" type="number" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="成本价(分)" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.costPrice" :min="0" class="w-100%" type="number" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="库存" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.stock" :min="0" class="w-100%" type="number" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="重量(kg)" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.weight" :min="0" class="w-100%" type="number" />
      </template>
    </el-table-column>
    <el-table-column align="center" label="体积(m^3)" min-width="120">
      <template #default="{ row }">
        <el-input v-model="row.volume" :min="0" class="w-100%" type="number" />
      </template>
    </el-table-column>
    <template v-if="formData.subCommissionType">
      <el-table-column align="center" label="一级返佣(分)" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.subCommissionFirstPrice" :min="0" class="w-100%" type="number" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="二级返佣(分)" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.subCommissionSecondPrice" :min="0" class="w-100%" type="number" />
        </template>
      </el-table-column>
    </template>
    <el-table-column v-if="formData.specType" align="center" fixed="right" label="操作" width="80">
      <template #default>
        <el-button v-if="isBatch" link size="small" type="primary">批量添加</el-button>
        <el-button v-else link size="small" type="primary">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" name="index" setup>
import { UploadImg } from '@/components/UploadFile'
import { PropType } from 'vue'
import { SpuType } from '@/api/mall/product/management/type/spuType'
import { propTypes } from '@/utils/propTypes'
import { SkuType } from '@/api/mall/product/management/type/skuType'

const props = defineProps({
  propFormData: {
    type: Object as PropType<SpuType>,
    default: () => {}
  },
  attributeList: {
    type: Array,
    default: () => []
  },
  isBatch: propTypes.bool.def(false) // 是否批量操作
})
const formData = ref<SpuType>() // 表单数据
// 批量添加时的零时数据
const SkuData = ref<SkuType[]>([
  {
    /**
     * 商品价格，单位：分
     */
    price: 0,
    /**
     * 市场价，单位：分
     */
    marketPrice: 0,
    /**
     * 成本价，单位：分
     */
    costPrice: 0,
    /**
     * 商品条码
     */
    barCode: '',
    /**
     * 图片地址
     */
    picUrl: '',
    /**
     * 库存
     */
    stock: 0,
    /**
     * 商品重量，单位：kg 千克
     */
    weight: 0,
    /**
     * 商品体积，单位：m^3 平米
     */
    volume: 0
  }
])
const tableHeaderList = ref<{ prop: string; label: string }[]>([])
/**
 * 将传进来的值赋值给SkuData
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
/** 监听属性列表生成相关参数和表头 */
watch(
  () => props.attributeList,
  (data) => {
    // 判断代理对象是否为空
    if (JSON.stringify(data) === '[]') return
    // 重置表头
    tableHeaderList.value = []
    // 重置表数据
    formData.value!.skus = []
    SkuData.value = []
    // 生成表头
    data.forEach((item, index) => {
      // name加属性项index区分属性值
      tableHeaderList.value.push({ prop: `name${index}`, label: item.name })
    })
    generateTableData(data)
  },
  {
    deep: true,
    immediate: true
  }
)
/** 生成表数据 */
const generateTableData = (data: any[]) => {
  // const row = {
  //   price: 0,
  //   marketPrice: 0,
  //   costPrice: 0,
  //   barCode: '',
  //   picUrl: '',
  //   stock: 0,
  //   weight: 0,
  //   volume: 0
  // }
  // 先把所有的属性值取出来
  const newDataList: any[] = []
  for (const index in data) {
    newDataList.push(data[index].values)
  }
  console.log(newDataList)
}
// const buildRow = (list: any[]) => {
//   for (const index in data) {
//     for (const index1 of data[index].values) {
//       row[`name${index1}`] = data[index].values[index1]
//     }
//   }
// }
</script>
