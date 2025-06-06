<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="basicInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
          <el-descriptions-item label="产品编码">{{ product.no }}</el-descriptions-item>
          <el-descriptions-item label="价格">
            {{ erpPriceInputFormatter(product.price) }} 元
          </el-descriptions-item>
          <el-descriptions-item label="产品描述">{{ product.description }}</el-descriptions-item>
          <el-descriptions-item label="产品类型">{{ product.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="是否上下架">
            <dict-tag :type="DICT_TYPE.CRM_PRODUCT_STATUS" :value="product.status" />
          </el-descriptions-item>
          <el-descriptions-item label="单位">
            <dict-tag :type="DICT_TYPE.CRM_PRODUCT_UNIT" :value="product.unit" />
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import * as ProductApi from '@/api/crm/product'
import { erpPriceInputFormatter } from '@/utils'

const { product } = defineProps<{
  product: ProductApi.ProductVO
}>()

// 展示的折叠面板
const activeNames = ref(['basicInfo'])
</script>
