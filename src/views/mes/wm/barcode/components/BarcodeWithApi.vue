<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { propTypes } from '@/utils/propTypes'
import Barcode from './Barcode.vue'
import { isValidBarcodeFormat } from '../constants/BarcodeConstants'

defineOptions({ name: 'BarcodeWithApi' })

interface BarcodeInfo {
  id?: number
  format: number // 条码格式
  content: string // 条码内容
  bizType?: number
  bizCode?: string
  bizName?: string
  status?: number
}

const props = defineProps({
  businessType: propTypes.string.isRequired, // 业务类型
  businessId: propTypes.number.isRequired, // 业务 ID
  width: propTypes.number.def(200), // 宽度
  height: propTypes.number.def(100), // 高度
  autoLoad: propTypes.bool.def(true) // 是否自动加载
})

const emit = defineEmits<{
  loaded: [data: BarcodeInfo] // 条码加载完成
  error: [error: Error] // 加载失败
}>()

const message = useMessage()
const barcodeRef = ref()
const barcodeData = ref<BarcodeInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 是否已加载
const isLoaded = computed(() => !!barcodeData.value)

/**
 * 加载条码数据
 */
const loadBarcode = async () => {
  if (!props.businessType || !props.businessId) {
    error.value = '业务类型或业务 ID 不能为空'
    return
  }

  loading.value = true
  error.value = null

  try {
    // TODO: 调用后端 API 获取条码数据
    // const response = await getBarcodeByBusinessApi({
    //   type: props.businessType,
    //   businessId: props.businessId
    // })

    // 临时模拟数据
    const response: BarcodeInfo = {
      format: 1,
      content: `${props.businessType}-${props.businessId}`,
      bizType: 101,
      bizCode: `CODE-${props.businessId}`,
      bizName: `业务-${props.businessId}`,
      status: 0
    }

    if (!response || !isValidBarcodeFormat(response.format)) {
      throw new Error('条码数据无效')
    }

    barcodeData.value = response
    emit('loaded', response)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '加载条码失败'
    error.value = errorMsg
    console.error('加载条码失败:', err)
    emit('error', err instanceof Error ? err : new Error(errorMsg))
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}

/**
 * 重新加载条码
 */
const reload = async () => {
  await loadBarcode()
}

/**
 * 获取条码 Base64
 */
const getImageBase64 = (): string => {
  return barcodeRef.value?.getImageBase64?.() || ''
}

// 监听业务 ID 变化，自动加载
watch(
  () => props.businessId,
  () => {
    if (props.autoLoad) {
      loadBarcode()
    }
  }
)

// 组件挂载时加载
onMounted(() => {
  if (props.autoLoad) {
    loadBarcode()
  }
})

// 暴露方法
defineExpose({
  loadBarcode,
  reload,
  getImageBase64,
  isLoaded
})
</script>

<template>
  <div class="barcode-with-api">
    <!-- 加载中 -->
    <el-skeleton v-if="loading" :rows="3" animated />

    <!-- 错误状态 -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      :closable="false"
      class="mb-12px"
    />

    <!-- 条码显示 -->
    <div v-else-if="isLoaded && barcodeData" class="barcode-content">
      <Barcode
        ref="barcodeRef"
        :content="barcodeData.content"
        :format="barcodeData.format"
        :width="width"
        :height="height"
      />
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无条码数据" />

    <!-- 操作按钮 -->
    <div v-if="isLoaded" class="barcode-actions mt-12px">
      <el-button size="small" @click="reload">
        <Icon icon="ep:refresh" class="mr-4px" /> 刷新
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.barcode-with-api {
  .barcode-content {
    display: flex;
    justify-content: center;
    padding: 12px;
    background-color: #f5f7fa;
    border-radius: 4px;
  }

  .barcode-actions {
    display: flex;
    justify-content: center;
    gap: 8px;
  }
}
</style>
