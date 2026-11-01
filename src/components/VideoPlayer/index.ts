import { createVNode, render } from 'vue'
import VideoPlayer from './src/VideoPlayer.vue'
import { isClient } from '@/utils/is'
import { VideoPlayerViewer } from '@/components/VideoPlayerViewer'
import { toAnyString } from '@/utils'

export { VideoPlayer }

/**
 * 打开视频预览弹层
 *
 * 由这里创建容器和 VNode，并负责清理：Viewer 关闭时 emit close，
 * 这里先 render(null) 卸载组件（触发播放器 destroy），再移除容器 DOM。
 * 返回的 destroy 可重复调用，只生效一次。
 */
export function createVideoViewer(options: { url: string; poster?: string; show?: boolean }) {
  if (!isClient) return
  const { url, poster } = options

  const container = document.createElement('div')
  const id = toAnyString()
  container.id = id

  let destroyed = false
  const destroy = () => {
    if (destroyed) return
    destroyed = true
    render(null, container)
    container.remove()
  }

  document.body.appendChild(container)
  const vnode = createVNode(VideoPlayerViewer, {
    url,
    poster,
    show: true,
    id,
    onClose: destroy
  })
  render(vnode, container)
  return destroy
}
