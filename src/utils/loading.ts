import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

class LoadingService {
  private loadingInstance: LoadingInstance | null = null
  private counter = 0

  // 显示loading
  show() {
    if (this.counter === 0) {
      this.loadingInstance = ElLoading.service({
        lock: true,
        text: 'Loading',
        customClass: 'el-overlay'
      })
    }
    this.counter++
  }

  // 隐藏loading
  hide() {
    if (this.counter <= 0) return
    this.counter--
    if (this.counter === 0) {
      this.loadingInstance?.close()
      this.loadingInstance = null
    }
  }
}

export const globalLoading = new LoadingService()
