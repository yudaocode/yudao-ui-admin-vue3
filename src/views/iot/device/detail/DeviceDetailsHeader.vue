<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ device.deviceName }}</span>
          </el-row>
        </el-col>
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button
          @click="openForm('update', device.id)"
          v-hasPermi="['iot:device:update']"
          v-if="product.status === 0"
        >
          编辑
        </el-button>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="horizontal">
      <el-descriptions-item label="产品">
        <el-link @click="goToProductDetail(product.id)">{{ product.name }}</el-link>
      </el-descriptions-item>
      <el-descriptions-item label="ProductKey">
        {{ product.productKey }}
        <el-button @click="copyToClipboard(product.productKey)">复制</el-button>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <DeviceForm ref="formRef" @success="emit('refresh')" />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import DeviceForm from '@/views/iot/device/DeviceForm.vue'
import { ProductVO } from '@/api/iot/product'
import { DeviceVO } from '@/api/iot/device'
import { useRouter } from 'vue-router'

const message = useMessage()
const router = useRouter()

// 操作修改
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>()
const emit = defineEmits(['refresh'])

/**
 * 将文本复制到剪贴板
 *
 * @param text 需要复制的文本
 */
const copyToClipboard = (text: string) => {
  // TODO @haohao：可以考虑用 await 异步转同步哈
  navigator.clipboard.writeText(text).then(() => {
    message.success('复制成功')
  })
}

/**
 * 跳转到产品详情页面
 *
 * @param productId 产品 ID
 */
const goToProductDetail = (productId: number) => {
  router.push({ name: 'IoTProductDetail', params: { id: productId } })
}
</script>
