import { ref } from 'vue'

/**
 * 语音播放全局互斥
 *
 * 模块级单例：同一时刻最多只有一条语音在播；新点的语音停掉旧的
 * 三处入口共享同一播放态：
 * - MessageBubble：气泡点击 toggle 当前条
 * - MessagePanel：切会话 stop()
 * - MessageHistory / MessageMergeDetailDialog：关闭时 stop()
 *
 * key 由 MessageBubble 在 setup 里 Symbol() 生成实例级唯一身份；不同来源（主面板 / 历史抽屉 /
 * 合并详情）的同一条语音 url 在不同气泡里也是不同 key，避免一处卸载误停另一处仍可见的播放。
 */
export type VoiceKey = symbol

interface VoiceTask {
  key: VoiceKey
  url: string
  audio: HTMLAudioElement
}

const currentTask = ref<VoiceTask | null>(null)

/**
 * 显式停止
 *
 * - 不传 key：强停（切会话 / 关弹窗用）
 * - 传 key：仅当当前 task 是该 key 时才停（气泡卸载兜底用，避免误停别人）
 */
function stop(key?: VoiceKey) {
  const task = currentTask.value
  if (!task) {
    return
  }
  if (key !== undefined && task.key !== key) {
    return
  }
  task.audio.pause()
  // removeAttribute('src') + load() 是 W3C 推荐的释放姿势：不会触发空 src 加载导致的 error 事件，
  // 也能让浏览器立即释放底层 decoder buffer，比 audio.src = '' 更干净
  task.audio.removeAttribute('src')
  task.audio.load()
  currentTask.value = null
}

/**
 * 切换播放
 *
 * - 同 key 再点：停掉
 * - 切到新 key：停旧起新
 */
function play(key: VoiceKey, url: string) {
  if (!url) {
    return
  }
  if (currentTask.value?.key === key) {
    stop(key)
    return
  }
  stop()
  const audio = new Audio(url)
  const task: VoiceTask = { key, url, audio }
  /** 播放结束 / 异常清栈；只清当前任务，避免被后续新任务的回调误清 */
  const finalize = () => {
    if (currentTask.value === task) {
      currentTask.value = null
    }
  }
  audio.addEventListener('ended', finalize, { once: true })
  audio.addEventListener('error', finalize, { once: true })
  currentTask.value = task
  audio.play().catch(finalize)
}

export function useVoicePlayer() {
  /** 指定 key 是否正在播放 */
  function isPlaying(key: VoiceKey): boolean {
    return currentTask.value?.key === key
  }
  return { isPlaying, play, stop }
}
