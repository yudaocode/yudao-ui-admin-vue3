<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, PropType, ref, unref, watch } from 'vue'
import QRCode, { QRCodeRenderersOptions } from 'qrcode'
import { cloneDeep } from 'lodash-es'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { isString } from '@/utils/is'
import { QrcodeLogo } from '@/types/qrcode'

defineOptions({ name: 'Qrcode' })

const props = defineProps({
  // img 或者 canvas,img不支持logo嵌套
  tag: propTypes.string.validate((v: string) => ['canvas', 'img'].includes(v)).def('canvas'),
  // 二维码内容
  text: {
    type: [String, Array] as PropType<string | Recordable[]>,
    default: null
  },
  // qrcode.js配置项
  options: {
    type: Object as PropType<QRCodeRenderersOptions>,
    default: () => ({})
  },
  // 宽度
  width: propTypes.number.def(200),
  // logo
  logo: {
    type: [String, Object] as PropType<Partial<QrcodeLogo> | string>,
    default: ''
  },
  // 是否过期
  disabled: propTypes.bool.def(false),
  // 过期提示内容
  disabledText: propTypes.string.def('')
})

// error：编码失败、logo 加载失败或 canvas 无法导出时触发
const emit = defineEmits(['done', 'click', 'disabled-click', 'error'])

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('qrcode')

const { toCanvas, toDataURL } = QRCode

const loading = ref(true)

const wrapRef = ref<Nullable<HTMLCanvasElement | HTMLImageElement>>(null)

const renderText = computed(() => String(props.text))

const wrapStyle = computed(() => {
  return {
    width: props.width + 'px',
    height: props.width + 'px'
  }
})

// 渲染代次：内容或配置快速变化时，只有最新一次渲染可提交画面、触发 done / error 并结束 loading
let renderId = 0
let isUnmounted = false
// 取消加载中的 logo（解绑图片回调）
let cancelLogo: (() => void) | undefined

// 将离屏 canvas 的画面与尺寸提交到页面 canvas
const commitCanvas = (source: HTMLCanvasElement, target: HTMLCanvasElement) => {
  target.width = source.width
  target.height = source.height
  target.style.width = source.style.width
  target.style.height = source.style.height
  target.getContext('2d')?.drawImage(source, 0, 0)
}

// 清空已显示的二维码（canvas 画面、img 地址）
const clearQrcode = () => {
  const target = unref(wrapRef)
  if (!target) return
  if (target instanceof HTMLCanvasElement) {
    target.getContext('2d')?.clearRect(0, 0, target.width, target.height)
  } else {
    target.removeAttribute('src')
  }
}

const initQrcode = async () => {
  const id = ++renderId
  cancelLogo?.()
  const isStale = () => isUnmounted || id !== renderId
  // 空文本：同样作废之前的渲染与加载中的 logo，结束 loading 并清空旧画面，不触发 done
  if (!renderText.value) {
    loading.value = false
    await nextTick()
    if (!isStale()) clearQrcode()
    return
  }
  loading.value = true
  try {
    await nextTick()
    if (isStale()) return
    const options = cloneDeep(props.options || {})
    if (props.tag === 'canvas') {
      // 容错率，默认对内容少的二维码采用高容错率，内容多的二维码采用低容错率
      options.errorCorrectionLevel =
        options.errorCorrectionLevel || getErrorCorrectionLevel(unref(renderText))
      const _width: number = await getOriginWidth(unref(renderText), options)
      if (isStale()) return
      options.scale = props.width === 0 ? undefined : (props.width / _width) * 4
      // 先绘制到离屏 canvas，确认仍是最新一次渲染后再提交到页面，避免旧渲染覆盖新画面
      let canvasRef = document.createElement('canvas')
      await toCanvas(canvasRef, unref(renderText), options)
      if (isStale()) return
      if (props.logo) {
        try {
          canvasRef = await createLogoCode(canvasRef, isStale)
        } catch (error) {
          // logo 加载失败：提示错误，仍展示不带 logo 的二维码
          if (isStale()) return
          emit('error', error)
        }
        if (isStale()) return
      }
      const target = unref(wrapRef) as HTMLCanvasElement | null
      if (!target) return
      commitCanvas(canvasRef, target)
      // 跨域 logo 污染 canvas 时 toDataURL 会抛出异常，由下方 catch 触发 error
      emit('done', canvasRef.toDataURL())
    } else {
      const url = await toDataURL(renderText.value, {
        errorCorrectionLevel: 'H',
        width: props.width,
        ...options
      })
      if (isStale()) return
      const target = unref(wrapRef) as HTMLImageElement | null
      if (!target) return
      target.src = url
      emit('done', url)
    }
  } catch (error) {
    // 编码失败等：不触发 done
    if (!isStale()) emit('error', error)
  } finally {
    if (!isStale()) loading.value = false
  }
}

// 内容、宽度、配置、logo、标签变化时重新绘制
watch(
  () => [renderText.value, props.width, props.options, props.logo, props.tag],
  () => {
    initQrcode()
  },
  {
    deep: true,
    immediate: true
  }
)

onBeforeUnmount(() => {
  isUnmounted = true
  renderId++
  cancelLogo?.()
})

// 在二维码副本上绘制 logo：logo 加载失败时，调用方仍可使用不带 logo 的二维码
const createLogoCode = (
  qrCanvas: HTMLCanvasElement,
  isStale: () => boolean
): Promise<HTMLCanvasElement> => {
  const canvasRef = document.createElement('canvas')
  canvasRef.width = qrCanvas.width
  canvasRef.height = qrCanvas.height
  canvasRef.style.width = qrCanvas.style.width
  canvasRef.style.height = qrCanvas.style.height
  const canvasWidth = canvasRef.width
  const logoOptions: QrcodeLogo = Object.assign(
    {
      logoSize: 0.15,
      bgColor: '#ffffff',
      borderSize: 0.05,
      crossOrigin: 'anonymous',
      borderRadius: 8,
      logoRadius: 0
    },
    isString(props.logo) ? {} : props.logo
  )
  const {
    logoSize = 0.15,
    bgColor = '#ffffff',
    borderSize = 0.05,
    crossOrigin = 'anonymous',
    borderRadius = 8,
    logoRadius = 0
  } = logoOptions
  const logoSrc = isString(props.logo) ? props.logo : props.logo.src
  const logoWidth = canvasWidth * logoSize
  const logoXY = (canvasWidth * (1 - logoSize)) / 2
  const logoBgWidth = canvasWidth * (logoSize + borderSize)
  const logoBgXY = (canvasWidth * (1 - logoSize - borderSize)) / 2

  const ctx = canvasRef.getContext('2d')
  if (!ctx) return Promise.resolve(qrCanvas)
  ctx.drawImage(qrCanvas, 0, 0)

  // logo 底色
  canvasRoundRect(ctx)(logoBgXY, logoBgXY, logoBgWidth, logoBgWidth, borderRadius)
  ctx.fillStyle = bgColor
  ctx.fill()

  // logo
  const image = new Image()

  // 使用image绘制可以避免某些跨域情况
  const drawLogoWithImage = (image: HTMLImageElement) => {
    ctx.drawImage(image, logoXY, logoXY, logoWidth, logoWidth)
  }

  // 使用canvas绘制以获得更多的功能
  const drawLogoWithCanvas = (image: HTMLImageElement) => {
    const canvasImage = document.createElement('canvas')
    canvasImage.width = logoXY + logoWidth
    canvasImage.height = logoXY + logoWidth
    const imageCanvas = canvasImage.getContext('2d')
    if (!imageCanvas || !ctx) return
    imageCanvas.drawImage(image, logoXY, logoXY, logoWidth, logoWidth)

    canvasRoundRect(ctx)(logoXY, logoXY, logoWidth, logoWidth, logoRadius)
    if (!ctx) return
    const fillStyle = ctx.createPattern(canvasImage, 'no-repeat')
    if (fillStyle) {
      ctx.fillStyle = fillStyle
      ctx.fill()
    }
  }

  // 将 logo 绘制到 canvas 上：先绑定回调再设置 src；被新的渲染取消或卸载时解绑回调
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const detach = () => {
      image.onload = null
      image.onerror = null
      if (cancelLogo === cancel) cancelLogo = undefined
    }
    const cancel = () => {
      detach()
      resolve(qrCanvas)
    }
    cancelLogo = cancel
    image.onload = () => {
      detach()
      if (isStale()) return resolve(qrCanvas)
      try {
        logoRadius ? drawLogoWithCanvas(image) : drawLogoWithImage(image)
        resolve(canvasRef)
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = () => {
      detach()
      reject(new Error(`Qrcode logo load failed: ${logoSrc}`))
    }
    if (crossOrigin || logoRadius) {
      image.setAttribute('crossOrigin', crossOrigin)
    }
    ;(image as any).src = logoSrc
  })
}

// 得到原QrCode的大小，以便缩放得到正确的QrCode大小
const getOriginWidth = async (content: string, options: QRCodeRenderersOptions) => {
  const _canvas = document.createElement('canvas')
  await toCanvas(_canvas, content, options)
  return _canvas.width
}

// 对于内容少的QrCode，增大容错率
const getErrorCorrectionLevel = (content: string) => {
  if (content.length > 36) {
    return 'M'
  } else if (content.length > 16) {
    return 'Q'
  } else {
    return 'H'
  }
}

// copy来的方法，用于绘制圆角
const canvasRoundRect = (ctx: CanvasRenderingContext2D) => {
  return (x: number, y: number, w: number, h: number, r: number) => {
    const minSize = Math.min(w, h)
    if (r > minSize / 2) {
      r = minSize / 2
    }
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
    return ctx
  }
}

const clickCode = () => {
  emit('click')
}

const disabledClick = () => {
  emit('disabled-click')
}
</script>

<template>
  <div v-loading="loading" :class="[prefixCls, 'relative inline-block']" :style="wrapStyle">
    <component :is="tag" ref="wrapRef" @click="clickCode" />
    <div
      v-if="disabled"
      :class="`${prefixCls}--disabled`"
      class="absolute left-0 top-0 h-full w-full flex items-center justify-center"
      @click="disabledClick"
    >
      <div class="absolute left-[50%] top-[50%] font-bold">
        <Icon :size="30" color="var(--el-color-primary)" icon="ep:refresh-right" />
        <div>{{ disabledText }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-qrcode;

.#{$prefix-cls} {
  &--disabled {
    background: rgb(255 255 255 / 95%);

    & > div {
      transform: translate(-50%, -50%);
    }
  }
}
</style>
