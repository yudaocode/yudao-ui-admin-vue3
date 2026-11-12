import type { Plugin } from 'vite'

// Element Plus 全量样式（参考上游 379b34075 的 VITE_USE_ALL_ELEMENT_PLUS_STYLE 开关，实现方式不同）：
// 仅 VITE_USE_ALL_ELEMENT_PLUS_STYLE=true 时，virtual:element-plus-style 引入 element-plus/dist/index.css，
// 并由 createVitePlugins 关闭组件/API 自动导入的按需样式及 unplugin-element-plus；其它取值输出空模块，保持原有按需样式。
// src/main.ts 首行静态引入该模块，使全量样式早于项目样式插入，项目对 Element Plus 的覆盖样式照常生效
// （上游在 setupElementPlus 中动态 import，样式会晚于项目样式插入，故不照搬）。

const VIRTUAL_ID = 'virtual:element-plus-style'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

/** 是否启用 Element Plus 全量样式，仅取值严格为 'true' 时启用 */
export const isAllElementPlusStyle = (env: Record<string, string> = {}) =>
  env.VITE_USE_ALL_ELEMENT_PLUS_STYLE === 'true'

export const createElementPlusStylePlugin = (env: Record<string, string> = {}): Plugin => {
  const enabled = isAllElementPlusStyle(env)
  return {
    name: 'yudao:element-plus-style',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return
      return enabled ? "import 'element-plus/dist/index.css'\n" : 'export {}\n'
    }
  }
}
