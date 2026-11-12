import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import type { Plugin, ViteDevServer } from 'vite'

// dev 启动后复制服务地址（参考上游 f5ab9776a 的 vite-plugin-url-copy，本地实现、不新增依赖）：
// 仅 VITE_DEV_URL_COPY=local|network 时启用，复制 Vite 实际监听的首个 local / network 地址（端口被占用自动换口时为新端口）；
// build、preview 及 CI 环境不触发。通过系统剪贴板命令的 stdin 写入，不经过 shell；任何失败只提示，不影响 dev 服务。

type CopyMode = 'local' | 'network'

// 剪贴板命令最长等待时间，超时结束子进程
const COPY_TIMEOUT = 3000

// 本进程最近一次复制的地址：vite.config 变更触发 server 重启且地址未变时，不重复写入剪贴板
const LAST_COPIED_KEY = Symbol.for('yudao:url-copy:last')

const isCI = () => !!process.env.CI && process.env.CI !== 'false'

// 按平台依次尝试的剪贴板命令，前一个不存在时尝试下一个
const getClipboardCommands = (): [string, string[]][] => {
  if (process.platform === 'darwin') return [['pbcopy', []]]
  if (process.platform === 'win32') return [['clip', []]]
  const commands: [string, string[]][] = [
    ['xclip', ['-selection', 'clipboard']],
    ['xsel', ['--clipboard', '--input']]
  ]
  // wl-copy 仅在 Wayland 会话中可用
  if (process.env.WAYLAND_DISPLAY) commands.unshift(['wl-copy', []])
  return commands
}

// 执行剪贴板命令并通过 stdin 写入文本；命令不存在返回 'missing'，成功返回 'ok'，其余返回失败原因
const runCommand = (command: string, args: string[], text: string, children: Set<ChildProcess>) =>
  new Promise<string>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true })
    const finish = (result: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      children.delete(child)
      resolve(result)
    }
    children.add(child)
    timer = setTimeout(() => {
      child.kill()
      finish(`${command} 超时`)
    }, COPY_TIMEOUT)
    child.on('error', (error: NodeJS.ErrnoException) => {
      finish(error.code === 'ENOENT' ? 'missing' : `${command}: ${error.message}`)
    })
    child.on('close', (code) => finish(code === 0 ? 'ok' : `${command} 退出码 ${code}`))
    // 命令提前退出时写入会 EPIPE，结果以 close / error 为准
    child.stdin?.on('error', () => {})
    child.stdin?.end(text)
  })

const copyServerUrl = async (
  server: ViteDevServer,
  mode: CopyMode,
  children: Set<ChildProcess>
) => {
  const { logger } = server.config
  const url = server.resolvedUrls?.[mode][0]
  if (!url) {
    logger.warn(
      `[url-copy] 没有可复制的 ${mode} 地址` +
        (mode === 'network' ? '（server.host 需监听外部地址）' : '')
    )
    return
  }
  const store = globalThis as unknown as Record<symbol, unknown>
  if (store[LAST_COPIED_KEY] === url) return
  const commands = getClipboardCommands()
  for (const [command, args] of commands) {
    const result = await runCommand(command, args, url, children)
    if (result === 'missing') continue
    if (result === 'ok') {
      store[LAST_COPIED_KEY] = url
      logger.info(`[url-copy] 已复制 ${mode} 地址到剪贴板：${url}`)
    } else {
      logger.warn(`[url-copy] 复制地址失败（${result}），dev 服务不受影响`)
    }
    return
  }
  logger.warn(
    `[url-copy] 未找到剪贴板命令（${commands.map(([command]) => command).join(' / ')}），` +
      'dev 服务不受影响'
  )
}

export const createUrlCopyPlugin = (env: Record<string, string> = {}): Plugin | undefined => {
  const mode = env.VITE_DEV_URL_COPY
  if (mode !== 'local' && mode !== 'network') return undefined
  return {
    name: 'yudao:url-copy',
    apply: 'serve',
    configureServer(server) {
      const httpServer = server.httpServer
      // 中间件模式没有自身的 http 服务，CI 环境不操作剪贴板
      if (!httpServer || isCI()) return
      const children = new Set<ChildProcess>()
      // Vite 在 listen 时以 prependListener 写入 resolvedUrls，此监听执行时已是实际监听地址
      httpServer.once('listening', () => {
        void copyServerUrl(server, mode, children)
      })
      // 服务关闭（含重启）时结束仍在运行的剪贴板命令，不遗留子进程
      httpServer.once('close', () => {
        for (const child of children) child.kill()
        children.clear()
      })
    }
  }
}
