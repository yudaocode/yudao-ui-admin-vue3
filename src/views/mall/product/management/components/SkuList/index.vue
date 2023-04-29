<template>
  <el-table :data="SkuData" border class="tabNumWidth" size="small">
    <el-table-column align="center" fixed="left" label="图片" min-width="100">
      <template #default="{ row }">
        <UploadImg v-model="row.picUrl" height="80px" width="100%" />
      </template>
    </el-table-column>
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
    <template v-if="subCommissionType">
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
  </el-table>
</template>

<script lang="ts" name="index" setup>
import { propTypes } from '@/utils/propTypes'
import { UploadImg } from '@/components/UploadFile'
import { PropType } from 'vue'
import type { SkuType } from '@/api/mall/product/management/type/skuType'

const props = defineProps({
  skuData: {
    type: Array as PropType<SkuType>,
    default: () => []
  },
  subCommissionType: propTypes.bool.def(false) // 分销类型
})
const SkuData = ref<SkuType[]>([])
/**
 * 将传进来的值赋值给SkuData
 */
watch(
  () => props.skuData,
  (data) => {
    if (!data) return
    SkuData.value = data
  },
  {
    deep: true,
    immediate: true
  }
)
</script>
