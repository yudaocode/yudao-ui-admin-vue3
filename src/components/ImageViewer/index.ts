import ImageViewer from './src/ImageViewer.vue'
import { isClient } from '@/utils/is'
import { createVNode, render } from 'vue'
import { ImageViewerProps } from './src/types'

/**
 * 程序式打开图片预览：每次调用各自管理容器与 VNode，关闭时卸载并移除容器，多个实例互不影响
 *
 * @returns 手动清理函数（幂等，可忽略）；SSR 环境返回 undefined
 */
export function createImageViewer(options: ImageViewerProps): (() => void) | undefined {
  if (!isClient) return
  const {
    urlList,
    initialIndex = 0,
    infinite = true,
    hideOnClickModal = false,
    teleported = false,
    zIndex = 2000,
    show = true
  } = options

  const propsData: Partial<ImageViewerProps> = {}
  const container = document.createElement('div')
  propsData.urlList = urlList
  propsData.initialIndex = initialIndex
  propsData.infinite = infinite
  propsData.hideOnClickModal = hideOnClickModal
  propsData.teleported = teleported
  propsData.zIndex = zIndex
  propsData.show = show

  let destroyed = false
  const destroy = () => {
    if (destroyed) return
    destroyed = true
    render(null, container)
    container.remove()
  }
  // 初始不显示时没有可关闭的预览，不挂载，避免残留 DOM
  if (!show) {
    destroyed = true
    return destroy
  }

  document.body.appendChild(container)
  // 只处理本次创建的实例：关闭（按钮、ESC、点击遮罩）后卸载并移除自己的容器
  const vnode = createVNode(ImageViewer, { ...propsData, onClose: destroy })
  render(vnode, container)
  return destroy
}
