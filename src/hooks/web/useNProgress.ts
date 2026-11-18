import type { NProgressOptions } from 'nprogress'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

export const useNProgress = () => {
  NProgress.configure({ showSpinner: false } as NProgressOptions)

  // 进度条主题色只由 styles/index.scss 的 #nprogress 规则（var(--el-color-primary) !important）负责，
  // 随主题色切换自动生效，这里不再写内联颜色
  const start = () => {
    NProgress.start()
  }

  const done = () => {
    NProgress.done()
  }

  return {
    start,
    done
  }
}
