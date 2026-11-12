import type { NProgressOptions } from 'nprogress'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getCssVar } from '@/utils'

export const useNProgress = () => {
  NProgress.configure({ showSpinner: false } as NProgressOptions)

  // 进度条使用当前主题色：NProgress 每次 start 都会重新创建 bar（done 后移除），start 后 bar 已同步存在；
  // 主题色由 setCssVar 写入根元素，每次读取 --el-color-primary 的计算值，切换主题后同样生效
  const initColor = () => {
    const bar = document.getElementById('nprogress')?.getElementsByClassName('bar')[0] as ElRef
    if (bar) {
      bar.style.background = getCssVar('--el-color-primary')
    }
  }

  const start = () => {
    NProgress.start()
    initColor()
  }

  const done = () => {
    NProgress.done()
  }

  return {
    start,
    done
  }
}
