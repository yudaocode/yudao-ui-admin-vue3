import { existsSync, readdirSync, readFileSync } from 'fs'
import { createRequire } from 'module'
import { dirname, extname, join, resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'

// 离线图标子集（参考上游 49a1f54c9 / 7e9c4a610 的在线、离线开关，实现方式不同）：
// 仅 VITE_USE_ONLINE_ICON=false 时，构建期扫描 src 中以字面量出现的 `prefix:name`（兼容 vi- 前缀）
// 及 VITE_OFFLINE_ICONS 显式配置的名称，从 @iconify/json 中取出这些图标组成子集，由 virtual:offline-icons
// 输出给 src/plugins/svgIcon 同步注册。不使用 Uno presetIcons，避免整集合打包与业务图标改名。
// dev 下子集在启动时生成，新增源码图标需重启 dev 才会包含。

const VIRTUAL_ID = 'virtual:offline-icons'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

// 上游图标名前缀，与 Icon.vue 的解析规则一致
const ICON_PREFIX = 'vi-'

// 已由 src/plugins/svgIcon 全量注册的集合，不再重复打包（两处需保持一致）
const FULL_COLLECTIONS = ['ep', 'fa', 'fa-solid']

// 扫描的源码类型
const SCAN_EXTENSIONS = ['.vue', '.ts', '.tsx', '.js', '.jsx']

// 图标名称：prefix:name，二者均为小写字母、数字以'-'连接（Iconify 命名规则）
const NAME_PART = '[a-z0-9]+(?:-[a-z0-9]+)*'
const ICON_NAME_REG = new RegExp(`(?<![\\w:-])(${NAME_PART}):(${NAME_PART})(?![\\w:-])`, 'g')
const CONFIG_NAME_REG = new RegExp(`^(${NAME_PART}):(${NAME_PART})$`)

// 子集保留的集合级属性：默认尺寸与偏移
const COLLECTION_PROPS = ['width', 'height', 'left', 'top']

interface IconifyCollection {
  prefix: string
  icons: Record<string, Record<string, unknown>>
  aliases?: Record<string, { parent: string } & Record<string, unknown>>
  [key: string]: unknown
}

interface OfflineIconsResult {
  collections: IconifyCollection[]
  iconCount: number
  extraCount: number
}

// 递归列出目录下需要扫描的文件
const listFiles = (dir: string, files: string[] = []): string[] => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // 不跟随源码符号链接，避免目录环路或扫描项目外内容。
    if (entry.isSymbolicLink()) continue
    const file = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') listFiles(file, files)
    } else if (entry.isFile() && SCAN_EXTENSIONS.includes(extname(entry.name))) {
      files.push(file)
    }
  }
  return files
}

// 去掉一次 vi- 前缀；去掉后不是已安装的集合时保持原样
const normalizePrefix = (prefix: string, available: Set<string>) => {
  if (prefix.startsWith(ICON_PREFIX)) {
    const stripped = prefix.slice(ICON_PREFIX.length)
    if (!available.has(prefix) && available.has(stripped)) return stripped
  }
  return prefix
}

export const createOfflineIconsPlugin = (env: Record<string, string> = {}): Plugin => {
  const enabled = env.VITE_USE_ONLINE_ICON === 'false'
  const root = process.cwd()
  let config: ResolvedConfig | undefined
  let result: OfflineIconsResult | undefined

  const generate = (): OfflineIconsResult => {
    // 定位 @iconify/json 的 json 目录
    let jsonDir: string
    try {
      const require = createRequire(resolve(root, 'package.json'))
      jsonDir = join(dirname(require.resolve('@iconify/json/package.json')), 'json')
    } catch {
      throw new Error('[offline-icons] 未找到 @iconify/json，无法生成离线图标')
    }
    const available = new Set(
      readdirSync(jsonDir)
        .filter((name) => name.endsWith('.json'))
        .map((name) => name.slice(0, -'.json'.length))
    )
    const cache = new Map<string, IconifyCollection>()
    const loadCollection = (prefix: string) => {
      let data = cache.get(prefix)
      if (!data) {
        data = JSON.parse(
          readFileSync(join(jsonDir, `${prefix}.json`), 'utf-8')
        ) as IconifyCollection
        cache.set(prefix, data)
      }
      return data
    }
    const hasIcon = (prefix: string, name: string) => {
      const data = loadCollection(prefix)
      return (
        Object.hasOwn(data.icons, name) || !!(data.aliases && Object.hasOwn(data.aliases, name))
      )
    }

    // prefix -> 图标名称集合
    const picked = new Map<string, Set<string>>()
    const pick = (prefix: string, name: string) => {
      if (FULL_COLLECTIONS.includes(prefix)) return
      let names = picked.get(prefix)
      if (!names) picked.set(prefix, (names = new Set()))
      names.add(name)
    }

    // 1. 源码字面量：集合与图标都存在才收录，其它形如 a:b 的字符串忽略
    const srcDir = resolve(root, 'src')
    for (const file of existsSync(srcDir) ? listFiles(srcDir) : []) {
      const content = readFileSync(file, 'utf-8')
      for (const match of content.matchAll(ICON_NAME_REG)) {
        const prefix = normalizePrefix(match[1], available)
        if (available.has(prefix) && hasIcon(prefix, match[2])) pick(prefix, match[2])
      }
    }

    // 2. VITE_OFFLINE_ICONS：逗号分隔的 prefix:name，用于后台菜单、运行时拼接等源码中没有字面量的图标；
    // 严格校验，任一项无效即报错，避免离线时静默缺图
    const invalid: string[] = []
    let extraCount = 0
    for (const raw of (env.VITE_OFFLINE_ICONS || '').split(',')) {
      const value = raw.trim()
      if (!value) continue
      const match = CONFIG_NAME_REG.exec(value)
      const prefix = match ? normalizePrefix(match[1], available) : ''
      if (!match) {
        invalid.push(`${value}（格式应为 prefix:name）`)
      } else if (!available.has(prefix)) {
        invalid.push(`${value}（@iconify/json 中不存在图标集 ${prefix}）`)
      } else if (!hasIcon(prefix, match[2])) {
        invalid.push(`${value}（图标集 ${prefix} 中不存在图标 ${match[2]}）`)
      } else {
        pick(prefix, match[2])
        extraCount++
      }
    }
    if (invalid.length) {
      throw new Error(
        `[offline-icons] VITE_OFFLINE_ICONS 包含无效图标：\n  ${invalid.join('\n  ')}`
      )
    }

    // 3. 生成子集：图标本身、别名及其父级链（保留别名上的 rotate/hFlip/vFlip 等变换），以及集合级默认尺寸
    const collections: IconifyCollection[] = []
    let iconCount = 0
    for (const [prefix, names] of [...picked].sort(([a], [b]) => a.localeCompare(b))) {
      const data = loadCollection(prefix)
      const subset: IconifyCollection = { prefix, icons: {} }
      for (const key of COLLECTION_PROPS) {
        if (data[key] !== undefined) subset[key] = data[key]
      }
      const addName = (name: string) => {
        if (
          Object.hasOwn(subset.icons, name) ||
          (subset.aliases && Object.hasOwn(subset.aliases, name))
        )
          return
        if (Object.hasOwn(data.icons, name)) {
          subset.icons[name] = data.icons[name]
          return
        }
        const alias =
          data.aliases && Object.hasOwn(data.aliases, name) ? data.aliases[name] : undefined
        if (alias) {
          subset.aliases = subset.aliases || {}
          subset.aliases[name] = alias
          addName(alias.parent)
        }
      }
      for (const name of [...names].sort()) addName(name)
      iconCount += names.size
      collections.push(subset)
    }
    return { collections, iconCount, extraCount }
  }

  return {
    name: 'yudao:offline-icons',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    buildStart() {
      if (!enabled || result) return
      result = generate()
      config?.logger.info(
        `[offline-icons] 离线图标子集：${result.collections.length} 个图标集，${result.iconCount} 个图标` +
          `（VITE_OFFLINE_ICONS 有效项 ${result.extraCount} 个），${FULL_COLLECTIONS.join('/')} 全量注册`
      )
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return
      if (!enabled) return 'export const offline = false\nexport const collections = []\n'
      if (!result) result = generate()
      return `export const offline = true\nexport const collections = ${JSON.stringify(result.collections)}\n`
    }
  }
}
