<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ product.name }}</span>
          </el-row>
        </el-col>
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button
          @click="openForm('update', product.id)"
          v-hasPermi="['iot:product:update']"
          v-if="product.status === 0"
        >
          编辑
        </el-button>
        <el-button
          type="primary"
          @click="confirmPublish(product.id)"
          v-hasPermi="['iot:product:update']"
          v-if="product.status === 0"
        >
          发布
        </el-button>
        <el-button
          type="danger"
          @click="confirmUnpublish(product.id)"
          v-hasPermi="['iot:product:update']"
          v-if="product.status === 1"
        >
          撤销发布
        </el-button>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="horizontal">
      <el-descriptions-item label="ProductKey">
        {{ product.productKey }}
        <el-button @click="copyToClipboard(product.productKey)">复制</el-button>
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="5" direction="horizontal">
      <el-descriptions-item label="设备数">
        {{ product.deviceCount ?? '加载中...' }}
        <el-button @click="goToDeviceList(product.id)">前往管理</el-button>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <ProductForm ref="formRef" @success="emit('refresh')" />
</template>
<script setup lang="ts">
import ProductForm from '@/views/iot/product/product/ProductForm.vue'
import { ProductApi, ProductVO } from '@/api/iot/product/product'

const message = useMessage()

const { product } = defineProps<{ product: ProductVO }>() // 定义 Props

/** 复制到剪贴板方法 */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('复制成功')
  } catch (error) {
    message.error('复制失败')
  }
}

/** 路由跳转到设备管理 */
const { push } = useRouter()
const goToDeviceList = (productId: number) => {
  push({ name: 'IoTDevice', params: { productId } })
}

/** 修改操作 */
const emit = defineEmits(['refresh']) // 定义 Emits
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 发布操作 */
const confirmPublish = async (id: number) => {
  try {
    await ProductApi.updateProductStatus(id, 1)
    message.success('发布成功')
    formRef.value.close() // 关闭弹框
    emit('refresh')
  } catch (error) {
    message.error('发布失败')
  }
}

/** 撤销发布操作 */
const confirmUnpublish = async (id: number) => {
  try {
    await ProductApi.updateProductStatus(id, 0)
    message.success('撤销发布成功')
    formRef.value.close() // 关闭弹框
    emit('refresh')
  } catch (error) {
    message.error('撤销发布失败')
  }
}
</script>
