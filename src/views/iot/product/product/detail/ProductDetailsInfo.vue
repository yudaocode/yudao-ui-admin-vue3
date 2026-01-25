<template>
  <ContentWrap>
    <el-descriptions :column="3" title="产品信息" border>
      <el-descriptions-item label="产品名称">{{ product.name }}</el-descriptions-item>
      <el-descriptions-item label="所属分类">{{ product.categoryName }}</el-descriptions-item>
      <el-descriptions-item label="设备类型">
        <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="product.deviceType" />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(product.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="数据格式">
        <dict-tag :type="DICT_TYPE.IOT_CODEC_TYPE" :value="product.codecType" />
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
      <el-descriptions-item label="动态注册">
        <el-tag :type="product.registerEnabled ? 'success' : 'info'">
          {{ product.registerEnabled ? '已开启' : '已关闭' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="产品密钥">
        <div class="flex items-center">
          <span>{{ secretVisible ? product.productSecret : '******' }}</span>
          <el-button link type="primary" class="ml-2" @click="secretVisible = !secretVisible">
            <Icon :icon="secretVisible ? 'ep:hide' : 'ep:view'" />
          </el-button>
          <el-button
            v-if="secretVisible && product.productSecret"
            link
            type="primary"
            class="ml-1"
            @click="copySecret"
          >
            <Icon icon="ep:document-copy" />
          </el-button>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="产品描述">{{ product.description }}</el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { DeviceTypeEnum, ProductVO } from '@/api/iot/product/product'
import { formatDate } from '@/utils/formatTime'
import { useClipboard } from '@vueuse/core'

const { product } = defineProps<{ product: ProductVO }>()

const message = useMessage()
const secretVisible = ref(false)
const { copy } = useClipboard()

/** 复制产品密钥 */
const copySecret = async () => {
  if (product.productSecret) {
    await copy(product.productSecret)
    message.success('复制成功')
  }
}
</script>
