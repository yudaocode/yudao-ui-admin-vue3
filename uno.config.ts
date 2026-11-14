import { defineConfig, toEscapedSelector as e, presetUno } from 'unocss'
import transformerVariantGroup from '@unocss/transformer-variant-group'

export default defineConfig({
  // ...UnoCSS options
  rules: [
    // 顶栏操作项悬停区域：header-action 为上游名称（参考上游 uno.config shortcuts，e66532cf9），custom-hover 保留为兼容别名。
    // 样式沿用本地：过渡时长用 --transition-time-02（系统“减少动态效果”时为 0s），不加上游 pt-1px（本地已修正 1px 偏移）
    [
      /^(header-action|custom-hover)$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector} {
  display: flex;
  height: 100%;
  padding: 0 10px;
  cursor: pointer;
  align-items: center;
  transition: background var(--transition-time-02);
}
/* you can have multiple rules */
${selector}:hover {
  background-color: var(--top-header-hover-color);
}
.dark ${selector}:hover {
  background-color: var(--el-bg-color-overlay);
}
`
      }
    ],
    [
      /^layout-border__left$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 100%;
  background-color: var(--layout-border-color);
  z-index: 3;
}
`
      }
    ],
    [
      /^layout-border__right$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background-color: var(--layout-border-color);
  z-index: 3;
}
`
      }
    ],
    [
      /^layout-border__top$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--layout-border-color);
  z-index: 3;
}
`
      }
    ],
    [
      /^layout-border__bottom$/,
      ([], { rawSelector }) => {
        const selector = e(rawSelector)
        return `
${selector}:after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--layout-border-color);
  z-index: 3;
}
`
      }
    ]
  ],
  presets: [presetUno({ dark: 'class', attributify: false })],
  // 变体分组（参考上游 719317694）：展开 hover:(a b)、lt-xl:(a b) 等写法，如 Login.vue、MessageFiles.vue 中的分组类
  transformers: [transformerVariantGroup()],
  shortcuts: {
    'wh-full': 'w-full h-full'
  },
  // 与上游一致额外扫描 .ts 文件中的原子类（参考上游 608bf50e1）；其余为 UnoCSS 66 默认扫描范围，未改动
  content: {
    pipeline: {
      include: [/\.(vue|svelte|[jt]sx|vine.ts|mdx?|astro|elm|php|phtml|marko|html|ts)($|\?)/]
    }
  }
})
