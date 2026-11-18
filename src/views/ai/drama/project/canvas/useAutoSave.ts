/**
 * AI 短剧画布、3D 导演工程：可选的自动保存
 *
 * 1. 默认关闭，由工具栏的「自动保存」复选框开启，偏好记在浏览器本地；手动保存按钮始终保留
 * 2. 编辑停顿后保存：沿用调用方的保存方法（修订号校验、以提交时的文档为保存基线，回包只更新修订号）
 * 3. 同一时间只发起一次保存；保存期间的新编辑，在本次结束后重新排队；暂时不能保存（加载、导出、对话框关闭）时，
 *    等能保存或下一次编辑时再排队，不空转计时
 * 4. 保存失败（包括修订号冲突）时暂停自动保存，保留未保存的状态，由用户检查后手动保存；手动保存成功后恢复
 * 5. 离开前由调用方 flush：立即保存，保存成功后再离开
 */
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { until, useStorage } from '@vueuse/core'

export interface DramaAutoSaveOptions {
  /** 偏好的本地存储键 */
  storageKey: string
  /** 文档的序列化结果：变化即视为编辑 */
  snapshot: () => string
  /** 是否有未保存的修改 */
  dirty: Ref<boolean>
  /** 是否有保存进行中（包括手动保存） */
  saving: Ref<boolean>
  /** 当前能否保存：加载、保存、导出中等不能时，等能保存时再排队 */
  ready: () => boolean
  /** 保存：成功返回 true；失败返回 false（错误提示由请求拦截器展示） */
  save: () => Promise<boolean>
  /** 编辑停顿多久后保存，单位毫秒 */
  delay?: number
}

export const useDramaAutoSave = (options: DramaAutoSaveOptions) => {
  const delay = options.delay ?? 1200
  const enabled = useStorage(options.storageKey, false) // 是否开启自动保存，默认关闭
  const paused = ref(false) // 自动保存失败后暂停，手动保存成功或重新勾选后恢复
  const running = ref(false) // 自动保存进行中
  const waiting = ref(false) // 到点时不能保存，等能保存时再排队
  let timer: ReturnType<typeof setTimeout> | undefined

  const cancel = () => {
    waiting.value = false
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  /** 编辑停顿后保存；已有排队的，按最后一次编辑重新计时 */
  const schedule = () => {
    cancel()
    if (!enabled.value || paused.value) {
      return
    }
    timer = setTimeout(run, delay)
  }

  const run = async () => {
    timer = undefined
    if (!enabled.value || paused.value || !options.dirty.value) {
      return
    }
    // 正在加载、保存（包括手动保存）、导出时：等能保存时再排队，不重复计时
    if (running.value || !options.ready()) {
      waiting.value = true
      return
    }
    running.value = true
    try {
      if (!(await options.save())) {
        paused.value = true
        return
      }
    } finally {
      running.value = false
    }
    // 保存期间又有编辑：重新排队
    if (options.dirty.value) {
      schedule()
    }
  }

  // 能保存时，补上等待中的保存
  watch(
    () => !running.value && options.ready(),
    (value) => {
      if (value && waiting.value) {
        schedule()
      }
    }
  )

  // 文档变化后排队保存：刚加载（与加载的文档相同）时不保存；之后的变化都按编辑处理
  let baseline: string | undefined
  watch(options.snapshot, (value) => {
    if (value === baseline) {
      return
    }
    baseline = undefined
    schedule()
  })

  /** 加载（包括重新加载）文档后调用：以它为基线，放弃排队中的保存，恢复暂停 */
  const reset = () => {
    baseline = options.snapshot()
    paused.value = false
    cancel()
  }
  // 勾选后：恢复暂停，有未保存的修改时排队；取消勾选时放弃排队中的保存
  watch(enabled, (value) => {
    paused.value = false
    if (value && options.dirty.value) {
      schedule()
    } else if (!value) {
      cancel()
    }
  })

  /** 手动保存成功后调用：恢复自动保存 */
  const resume = () => {
    paused.value = false
    if (options.dirty.value) {
      schedule()
    }
  }

  /**
   * 离开前立即保存：放弃计时，等在途的保存结束；仍有未保存的修改时再保存一次
   *
   * 只在开启且未暂停时保存；失败时暂停。返回是否已没有未保存的修改，由调用方决定是否确认离开
   */
  const flush = async () => {
    cancel()
    if (!enabled.value || paused.value) {
      return !options.dirty.value
    }
    while (options.saving.value) {
      await until(options.saving).toBe(false)
    }
    if (options.dirty.value && !(await options.save())) {
      paused.value = true
    }
    return !options.dirty.value
  }

  onBeforeUnmount(cancel)

  return { enabled, paused, running, cancel, reset, resume, flush }
}
