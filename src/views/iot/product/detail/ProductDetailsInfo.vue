<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="basicInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
          <el-descriptions-item label="产品标识">{{ product.identification }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
          </el-descriptions-item>
          <el-descriptions-item label="数据格式">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DATA_FORMAT" :value="product.dataFormat" />
          </el-descriptions-item>
          <el-descriptions-item label="协议类型">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_PROTOCOL_TYPE" :value="product.protocolType" />
          </el-descriptions-item>
          <el-descriptions-item label="产品状态">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
          </el-descriptions-item>
          <el-descriptions-item label="产品描述">{{ product.description }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { ProductVO } from '@/api/iot/product'

const { product } = defineProps<{ product: ProductVO }>()

// 展示的折叠面板
const activeNames = ref(['basicInfo'])
</script>
