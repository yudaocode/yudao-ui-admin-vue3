<!-- 设备信息（头部） -->
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
import DeviceForm from '@/views/iot/device/device/DeviceForm.vue'
import { ProductVO } from '@/api/iot/product/product'
import { DeviceVO } from '@/api/iot/device/device'

const message = useMessage()
const router = useRouter()

const { product, device } = defineProps<{ product: ProductVO; device: DeviceVO }>()
const emit = defineEmits(['refresh'])

/** 操作修改 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 复制到剪贴板方法 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('复制成功')
  } catch (error) {
    message.error('复制失败')
  }
}

/** 跳转到产品详情页面 */
const goToProductDetail = (productId: number) => {
  router.push({ name: 'IoTProductDetail', params: { id: productId } })
}
</script>
