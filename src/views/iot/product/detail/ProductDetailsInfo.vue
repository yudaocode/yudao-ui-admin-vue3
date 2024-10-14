<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-descriptions :column="3" title="产品信息">
        <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(product.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="数据格式">
          <dict-tag :type="DICT_TYPE.IOT_DATA_FORMAT" :value="product.dataFormat" />
        </el-descriptions-item>
        <el-descriptions-item label="数据校验级别">
          <dict-tag :type="DICT_TYPE.IOT_VALIDATE_TYPE" :value="product.validateType" />
        </el-descriptions-item>
        <el-descriptions-item label="产品状态">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="product.status" />
        </el-descriptions-item>
        <el-descriptions-item
          label="联网方式"
          v-if="product.deviceType === 0 || product.deviceType === 2"
        >
          <dict-tag :type="DICT_TYPE.IOT_NET_TYPE" :value="product.netType" />
        </el-descriptions-item>
        <el-descriptions-item label="接入网关协议" v-if="product.deviceType === 1">
          <dict-tag :type="DICT_TYPE.IOT_PROTOCOL_TYPE" :value="product.protocolType" />
        </el-descriptions-item>
        <el-descriptions-item label="产品描述">{{ product.description }}</el-descriptions-item>
      </el-descriptions>
    </el-collapse>
  </ContentWrap>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { ProductVO } from '@/api/iot/product'
import { formatDate } from '@/utils/formatTime'

const { product } = defineProps<{ product: ProductVO }>()

// 展示的折叠面板
const activeNames = ref(['basicInfo'])
</script>
