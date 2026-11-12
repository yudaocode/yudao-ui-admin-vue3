import { useAppStore } from '@/store/modules/app'
import { getCurrentScope, onScopeDispose, watch } from 'vue'

const domSymbol = Symbol('watermark-dom')
// 局部水印的实例序号，用于生成互不冲突的节点 id
let localWatermarkSeed = 0

/**
 * 水印
 *
 * appendEl 默认为 document.body：全局水印，沿用固定的节点 id，尺寸铺满页面（项目配置中的水印即为此种）。
 * 传入其它容器时为局部水印：使用独立的节点 id，尺寸取容器大小，只增删该容器内本实例的节点，不影响全局水印；
 * 在组件内调用时，组件卸载会一并清除局部水印。容器需自行设置 position: relative 与 overflow: hidden。
 */
export function useWatermark(appendEl: HTMLElement | null = document.body) {
  let func: Fn = () => {}
  const isGlobal = appendEl === document.body
  const id = isGlobal ? domSymbol.toString() : `watermark-dom-${++localWatermarkSeed}`
  const appStore = useAppStore()
  let watermarkStr = ''

  // 移除水印节点：只移除 appendEl 下的节点，避免误删其它容器中的同 id 节点
  const removeWatermark = () => {
    const domId = document.getElementById(id)
    if (domId && appendEl && domId.parentNode === appendEl) {
      appendEl.removeChild(domId)
    }
  }
  // 清除水印：同时清空水印文字，主题切换、窗口缩放后不再重新生成
  const clear = () => {
    watermarkStr = ''
    removeWatermark()
    window.removeEventListener('resize', func)
  }
  const createWatermark = (str: string) => {
    removeWatermark()

    const can = document.createElement('canvas')
    can.width = 300
    can.height = 240

    const cans = can.getContext('2d')
    if (cans) {
      cans.rotate((-20 * Math.PI) / 120)
      cans.font = '15px Vedana'
      cans.fillStyle = appStore.getIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
      cans.textAlign = 'left'
      cans.textBaseline = 'middle'
      cans.fillText(str, can.width / 20, can.height)
    }

    const div = document.createElement('div')
    div.id = id
    div.style.pointerEvents = 'none'
    div.style.top = '0px'
    div.style.left = '0px'
    div.style.position = 'absolute'
    div.style.zIndex = '100000000'
    const width = isGlobal ? document.documentElement.clientWidth : appendEl?.clientWidth || 0
    const height = isGlobal ? document.documentElement.clientHeight : appendEl?.clientHeight || 0
    div.style.width = width + 'px'
    div.style.height = height + 'px'
    div.style.background = 'url(' + can.toDataURL('image/png') + ') left top repeat'
    const el = appendEl
    el && el.appendChild(div)
    return id
  }

  function setWatermark(str: string) {
    watermarkStr = str
    createWatermark(str)
    // 替换上一次的监听，避免重复注册
    window.removeEventListener('resize', func)
    func = () => {
      createWatermark(str)
    }
    window.addEventListener('resize', func)
  }

  // 监听主题变化
  watch(
    () => appStore.getIsDark,
    () => {
      if (watermarkStr) {
        createWatermark(watermarkStr)
      }
    }
  )

  // 局部水印随所在组件卸载清除；全局水印保持原有生命周期，不随调用组件卸载清除
  if (!isGlobal && getCurrentScope()) {
    onScopeDispose(clear)
  }

  return { setWatermark, clear }
}
