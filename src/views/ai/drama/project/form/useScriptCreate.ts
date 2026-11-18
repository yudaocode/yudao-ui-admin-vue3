import { DramaScriptApi, DramaScriptCreateReqVO } from '@/api/ai/drama/script'
import { getAccessToken, getCurrentUserId, getTenantId, getVisitTenantId } from '@/utils/auth'

/**
 * AI 短剧：从故事想法创建项目，流式生成初版剧本
 *
 * 状态放在模块级：同一页面应用内切换路由不中断原请求、不重复提交；整页刷新后不恢复（服务端仍会完成，结果在项目列表查看）。
 * 只属于发起时的身份（登录用户 + 访问租户）：刷新访问令牌不影响；退出登录、切换用户或访问租户后，中断并丢弃，
 * 旧任务的进度、结果都不再作用到新身份的界面
 */
export interface DramaScriptCreateJob {
  id: number
  identity: string // 发起时的身份：登录用户 + 访问租户
  form: DramaScriptCreateReqVO // 提交的表单：回到新建页时恢复
  status: 'running' | 'success' | 'fail'
  text: string // 已接收的原文（JSON）
  startTime: number
  lastTime?: number // 最近一次收到输出的时间
  error?: string
  interrupted?: boolean // 是否为连接中断：服务端可能仍在完成，不能断言项目未创建
  projectId?: number
}

/** 连接中断的提示：生成在服务端后台继续，结果不确定 */
const INTERRUPTED_ERROR = '连接已中断，生成可能仍在后台完成，请稍后在项目列表中查看，确认没有新项目后再重试'

const job = shallowRef<DramaScriptCreateJob>()
let jobCtrl: AbortController | undefined // 当前任务的请求：身份变化时中断
let jobId = 0
let viewers = 0 // 正在显示进度的新建页数量：为 0 时，结束只提示，不跳转

/**
 * 获得当前身份：登录用户编号 + 有效的访问租户（与请求头一致：已登录且选了访问租户时为访问租户，否则为登录租户）；
 * 未登录时为空。不使用访问令牌：令牌刷新后仍是同一身份
 */
const getIdentity = (): string | undefined => {
  const userId = getCurrentUserId()
  if (!userId || !getAccessToken()) {
    return undefined
  }
  let tenantId: number | string | undefined
  if (import.meta.env.VITE_APP_TENANT_ENABLE === 'true') {
    tenantId = getVisitTenantId() || getTenantId()
  }
  return `${userId}:${tenantId ?? ''}`
}

/** 身份变化（退出登录、切换用户或访问租户）时：中断并丢弃上一个身份的任务；返回任务是否仍属于当前身份 */
const checkIdentity = (): boolean => {
  if (!job.value) {
    return false
  }
  if (job.value.identity === getIdentity()) {
    return true
  }
  jobCtrl?.abort()
  jobCtrl = undefined
  job.value = undefined
  return false
}

/** 更新任务：已被替换（重新发起）、身份已变化时忽略 */
const update = (id: number, patch: Partial<DramaScriptCreateJob>) => {
  if (job.value?.id !== id || !checkIdentity()) {
    return
  }
  job.value = { ...job.value, ...patch }
  if (viewers > 0) {
    return
  }
  // 已离开新建页：只提示结果，不跳转
  if (patch.status === 'success') {
    ElMessage.success('初版剧本已生成，可在项目列表中查看')
    job.value = undefined
  } else if (patch.status === 'fail') {
    if (patch.interrupted) {
      ElMessage.warning(patch.error!)
    } else {
      ElMessage.error(`初版剧本生成失败：${patch.error}`)
    }
  }
}

/** 从生成中的 JSON 原文读取字符串字段：字符串未结束时，返回已接收的部分 */
export const readJsonField = (raw: string, key: string): string | undefined => {
  const match = new RegExp(`"${key}"\\s*:\\s*"`).exec(raw)
  if (!match) {
    return undefined
  }
  const escapes: Record<string, string> = { n: '\n', t: '\t', r: '', b: '', f: '' }
  let result = ''
  for (let i = match.index + match[0].length; i < raw.length; i++) {
    const c = raw[i]
    if (c === '"') {
      return result
    }
    if (c !== '\\') {
      result += c
      continue
    }
    const next = raw[++i]
    if (next === undefined) {
      break
    }
    if (next === 'u') {
      const hex = raw.slice(i + 1, i + 5)
      if (hex.length < 4) {
        break
      }
      result += String.fromCharCode(parseInt(hex, 16))
      i += 4
    } else {
      result += escapes[next] ?? next
    }
  }
  return result
}

export const useScriptCreate = () => {
  // 身份变化：中断并丢弃上一个身份的任务
  checkIdentity()

  const running = computed(() => job.value?.status === 'running')

  /** 发起生成：进行中时不重复提交 */
  const start = (form: DramaScriptCreateReqVO) => {
    checkIdentity()
    if (running.value) {
      return
    }
    const id = ++jobId
    const ctrl = new AbortController()
    jobCtrl = ctrl
    job.value = {
      id,
      identity: getIdentity() || '',
      form: { ...form },
      status: 'running',
      text: '',
      startTime: Date.now()
    }
    const fail = (error: string, interrupted = false) => {
      update(id, { status: 'fail', error, interrupted })
      ctrl.abort()
    }
    DramaScriptApi.createProjectStream({
      data: form,
      ctrl,
      onMessage: (res: any) => {
        if (job.value?.id !== id || job.value.status !== 'running' || !res.data || !checkIdentity()) {
          return
        }
        let result: any
        try {
          result = JSON.parse(res.data)
        } catch {
          return // 不是 CommonResult 的数据行（例如心跳）：忽略
        }
        if (result.code !== 0) {
          fail(result.msg || '生成失败')
          return
        }
        if (result.data?.projectId) {
          update(id, { status: 'success', projectId: result.data.projectId })
          ctrl.abort()
          return
        }
        if (result.data?.content) {
          update(id, { text: job.value.text + result.data.content, lastTime: Date.now() })
        }
      },
      onError: (error: any) => {
        // 服务端返回的业务错误在 onMessage 中处理；这里是网络、连接错误：请求可能已到达服务端
        fail(INTERRUPTED_ERROR, true)
        throw error // 抛出以结束，不自动重试，避免重复创建
      },
      onClose: () => {
        if (job.value?.id === id && job.value.status === 'running') {
          fail(INTERRUPTED_ERROR, true)
        }
      }
    }).catch(() => {})
  }

  /** 清除任务：已进入新项目，或重新填写 */
  const clear = () => {
    if (!running.value) {
      job.value = undefined
    }
  }

  /** 新建页显示进度期间登记：结束时由页面跳转 */
  const watchJob = () => {
    onMounted(() => viewers++)
    onBeforeUnmount(() => viewers--)
  }

  return { job, running, start, clear, watchJob }
}
