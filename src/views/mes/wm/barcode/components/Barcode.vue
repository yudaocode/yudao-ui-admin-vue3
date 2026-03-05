<script lang="ts" setup>
import { computed, nextTick, ref, unref, watch } from 'vue'
import QRCode, { QRCodeRenderersOptions } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { BarcodeFormatEnum, BARCODE_FORMAT_MAP } from '@/views/mes/wm/barcode/constants/BarcodeConstants'

defineOptions({ name: 'Barcode' })

const props = defineProps({
  content: propTypes.string.def(''), // 条码内容
  format: propTypes.number.def(BarcodeFormatEnum.QR_CODE), // 条码格式: 1=QR_CODE, 2=EAN13, 3=CODE39, 4=UPC_A；TODO @AI：这里 @对应枚举就 ok 了；
  width: propTypes.number.def(200), // 宽度
  height: propTypes.number.def(100), // 高度（仅一维码使用）
  displayValue: propTypes.bool.def(true) // 是否显示文本
})

const emit = defineEmits(['done'])

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('barcode')

const loading = ref(true)
const canvasRef = ref<Nullable<HTMLCanvasElement>>(null)
const imgRef = ref<Nullable<HTMLImageElement>>(null)

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

// TODO @AI：下面的 scss 尽量（最大化）使用 unocss
defineExpose({
  getImageBase64
})
</script>

<template>
  <div v-loading="loading" :class="[prefixCls, 'inline-block']" :style="wrapStyle">
    <canvas v-if="isQRCode" ref="canvasRef" ></canvas>
    <img v-else ref="imgRef" alt="barcode" />
  </div>
</template>

<style scoped lang="scss">
$prefix-cls: #{$namespace}-barcode;

.#{$prefix-cls} {
  canvas,
  img {
    display: block;
    max-width: 100%;
  }
}
</style>
