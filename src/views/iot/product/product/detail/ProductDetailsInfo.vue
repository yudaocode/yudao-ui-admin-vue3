<template>
  <ContentWrap>
    <el-descriptions :column="3" title="产品信息">
      <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
      <el-descriptions-item label="所属分类">{{ product.categoryName }}</el-descriptions-item>
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
        v-if="[DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(product.deviceType)"
      >
        <dict-tag :type="DICT_TYPE.IOT_NET_TYPE" :value="product.netType" />
      </el-descriptions-item>
      <el-descriptions-item
        label="接入网关协议"
        v-if="product.deviceType === DeviceTypeEnum.GATEWAY_SUB"
      >
        <dict-tag :type="DICT_TYPE.IOT_PROTOCOL_TYPE" :value="product.protocolType" />
      </el-descriptions-item>
      <el-descriptions-item label="产品描述">{{ product.description }}</el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { DeviceTypeEnum, ProductVO } from '@/api/iot/product/product'
import { formatDate } from '@/utils/formatTime'

const { product } = defineProps<{ product: ProductVO }>()
</script>
