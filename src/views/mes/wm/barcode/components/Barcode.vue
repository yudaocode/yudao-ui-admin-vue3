<template>
  <div v-loading="loading" class="inline-block" :style="wrapStyle">
    <canvas v-if="isQRCode" ref="canvasRef" class="block max-w-full"></canvas>
    <!--suppress RequiredAttributes：JsBarcode 需要原生图片 -->
    <img v-else ref="imgRef" alt="barcode" class="block max-w-full" />
  </div>
</template>
<script lang="ts" setup>
import { computed, nextTick, ref, unref, watch } from 'vue'
import QRCode, { QRCodeRenderersOptions } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { propTypes } from '@/utils/propTypes'
import { BarcodeFormatEnum, BARCODE_FORMAT_MAP } from '@/views/mes/utils/constants'

defineOptions({ name: 'Barcode' })

const props = defineProps({
  content: propTypes.string.def(''), // 条码内容
  format: propTypes.number.def(BarcodeFormatEnum.QR_CODE), // DONE @AI：条码格式，对应 BarcodeFormatEnum 枚举
  width: propTypes.number.def(200), // 宽度
  height: propTypes.number.def(100), // 高度（仅一维码使用）
  displayValue: propTypes.bool.def(true) // 是否显示文本
})

const emit = defineEmits(['done'])

const loading = ref(true) // 加载状态
const canvasRef = ref<Nullable<HTMLCanvasElement>>(null) // 二维码的 Canvas 引用
const imgRef = ref<Nullable<HTMLImageElement>>(null) // 一维码的图片引用
const isQRCode = computed(() => props.format === BarcodeFormatEnum.QR_CODE) // 判断是否为二维码
const wrapStyle = computed(() => {
  if (isQRCode.value) {
    return {
      width: props.width + 'px',
      height: props.width + 'px'
    }
  }
  return {
    width: props.width + 'px'
  }
})

/** 生成条码 */
const generateBarcode = async () => {
  if (!props.content) {
    loading.value = false
    return
  }

  await nextTick()
  loading.value = true
  try {
    if (isQRCode.value) {
      // 生成二维码
      const options: QRCodeRenderersOptions = {
        errorCorrectionLevel: 'M',
        width: props.width
      }
      await QRCode.toCanvas(unref(canvasRef) as HTMLCanvasElement, props.content, options)
      emit('done', (unref(canvasRef) as HTMLCanvasElement).toDataURL())
    } else {
      // 生成一维码
      const format = BARCODE_FORMAT_MAP[props.format] || 'CODE39'
      JsBarcode(unref(imgRef) as HTMLImageElement, props.content, {
        format: format,
        width: 2,
        height: props.height,
        displayValue: props.displayValue,
        margin: 10
      })
      emit('done', (unref(imgRef) as HTMLImageElement).src)
    }
  } catch (error) {
    console.error('生成条码失败:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.content, props.format],
  () => {
    if (props.content) {
      generateBarcode()
    }
  },
  {
    immediate: true
  }
)

/** 获取条码 Base64 数据 */
const getImageBase64 = (): string => {
  if (isQRCode.value) {
    return (unref(canvasRef) as HTMLCanvasElement)?.toDataURL() || ''
  } else {
    return (unref(imgRef) as HTMLImageElement)?.src || ''
  }
}

defineExpose({
  getImageBase64
})
</script>
