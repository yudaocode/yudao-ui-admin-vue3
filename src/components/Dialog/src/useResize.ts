import { useDesign } from '@/hooks/web/useDesign'

export interface UseResizeOptions {
  // 最小宽度（px）
  minWidth: () => number
  // 最小内容高度（px）
  minHeight: () => number
  // 宽度变化：拖拽中实时回调
  onWidthChange: (width: number) => void
  // 内容高度变化：拖拽中实时回调
  onHeightChange: (height: number) => void
}

// 距离对话框边缘多少像素内可以拖拽调整尺寸
const EDGE_SIZE = 8

// 内容区最大高度需要给标题栏、底部按钮及上下边距预留的空间（与上游一致）
const RESERVED_HEIGHT = 165

const CURSOR_MAP: Record<string, string> = {
  left: 'ew-resize',
  right: 'ew-resize',
  top: 'ns-resize',
  bottom: 'ns-resize',
  'top-left': 'nwse-resize',
  'bottom-right': 'nwse-resize',
  'top-right': 'nesw-resize',
  'bottom-left': 'nesw-resize'
}

/**
 * 对话框拖拽调整尺寸（参考上游 e6affad67 的 useResize）
 *
 * 与上游不同：不注册全局指令、不使用 MutationObserver；由调用方在对话框打开后 attach 到自己的 .el-dialog 元素，
 * 关闭、卸载时 detach。document 上的 mousemove / mouseup 只在拖拽期间通过 addEventListener 添加，
 * 不覆盖 document.onmousemove / onmouseup。全屏时不响应拖拽，也不写入宽高内联样式
 */
export const useResize = (options: UseResizeOptions) => {
  const { variables } = useDesign()
  const elNamespace = variables.elNamespace

  let cleanup: (() => void) | undefined

  const detach = () => {
    cleanup?.()
    cleanup = undefined
  }

  const attach = (dialogEl: HTMLElement) => {
    detach()

    let direction = ''
    let stopResizing: (() => void) | undefined

    const isFullscreen = () => dialogEl.classList.contains('is-fullscreen')

    // 内容区高度：Dialog 开启 scroll 时由 ElScrollbar 承载
    const getContentHeight = () => {
      const scrollbar = dialogEl.querySelector<HTMLElement>(
        `.${elNamespace}-dialog__body .${elNamespace}-scrollbar`
      )
      return scrollbar?.offsetHeight ?? 0
    }

    // 鼠标所在边缘：top / bottom / left / right 及四角组合，不在边缘时为 ''
    const getDirection = (e: MouseEvent) => {
      const rect = dialogEl.getBoundingClientRect()
      let vertical = ''
      if (e.clientY - rect.top <= EDGE_SIZE) vertical = 'top'
      else if (rect.bottom - e.clientY <= EDGE_SIZE) vertical = 'bottom'
      let horizontal = ''
      if (e.clientX - rect.left <= EDGE_SIZE) horizontal = 'left'
      else if (rect.right - e.clientX <= EDGE_SIZE) horizontal = 'right'
      return [vertical, horizontal].filter(Boolean).join('-')
    }

    const handleMouseMove = (e: MouseEvent) => {
      // 拖拽中保持当前方向与光标
      if (stopResizing) return
      direction = isFullscreen() ? '' : getDirection(e)
      dialogEl.style.cursor = CURSOR_MAP[direction] || ''
    }

    const handleMouseLeave = () => {
      if (stopResizing) return
      direction = ''
      dialogEl.style.cursor = ''
    }

    // 捕获阶段处理：位于边缘时阻止事件继续传到标题栏，避免同时触发 ElDialog 的拖动
    const handleMouseDown = (e: MouseEvent) => {
      if (!direction || e.button !== 0 || isFullscreen()) return
      e.preventDefault()
      e.stopPropagation()

      const startX = e.clientX
      const startY = e.clientY
      const startWidth = dialogEl.offsetWidth
      const startHeight = getContentHeight()
      const currentDirection = direction

      const handleResizing = (event: MouseEvent) => {
        // 拖拽中切换为全屏时停止
        if (isFullscreen()) {
          stopResizing?.()
          return
        }
        const dx = event.clientX - startX
        const dy = event.clientY - startY
        // 对话框水平居中，左右两侧同时变化，宽度按位移的 2 倍计算
        if (currentDirection.includes('left') || currentDirection.includes('right')) {
          const delta = currentDirection.includes('right') ? dx * 2 : -dx * 2
          const maxWidth = window.innerWidth
          const width = Math.min(maxWidth, Math.max(options.minWidth(), startWidth + delta))
          options.onWidthChange(Math.round(width))
        }
        if (
          startHeight &&
          (currentDirection.includes('top') || currentDirection.includes('bottom'))
        ) {
          const delta = currentDirection.includes('bottom') ? dy : -dy
          const maxHeight = Math.max(options.minHeight(), window.innerHeight - RESERVED_HEIGHT)
          const height = Math.min(maxHeight, Math.max(options.minHeight(), startHeight + delta))
          options.onHeightChange(Math.round(height))
        }
      }

      const handleMouseUp = () => stopResizing?.()
      stopResizing = () => {
        document.removeEventListener('mousemove', handleResizing)
        document.removeEventListener('mouseup', handleMouseUp)
        stopResizing = undefined
      }

      document.addEventListener('mousemove', handleResizing)
      document.addEventListener('mouseup', handleMouseUp)
    }

    dialogEl.addEventListener('mousemove', handleMouseMove)
    dialogEl.addEventListener('mouseleave', handleMouseLeave)
    dialogEl.addEventListener('mousedown', handleMouseDown, true)

    cleanup = () => {
      stopResizing?.()
      dialogEl.removeEventListener('mousemove', handleMouseMove)
      dialogEl.removeEventListener('mouseleave', handleMouseLeave)
      dialogEl.removeEventListener('mousedown', handleMouseDown, true)
      dialogEl.style.cursor = ''
    }
  }

  return {
    attach,
    detach
  }
}
