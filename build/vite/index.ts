import { resolve } from 'path'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
// @ts-ignore
import ElementPlus from 'unplugin-element-plus/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons-ng'
import UnoCSS from 'unocss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import type { PluginOption } from 'vite'
import { createOfflineIconsPlugin } from './offlineIcons'
import { createElementPlusStylePlugin, isAllElementPlusStyle } from './elementPlusStyle'
import { createUrlCopyPlugin } from './urlCopy'

export function createVitePlugins(isBuild = false, env: Record<string, string> = {}) {
  const root = process.cwd()
  // Element Plus 全量样式模式（VITE_USE_ALL_ELEMENT_PLUS_STYLE=true）：样式由 virtual:element-plus-style 统一提供，
  // 自动导入组件/API 时不再逐个引入样式；其它取值保持原有按需样式
  const allElementPlusStyle = isAllElementPlusStyle(env)
  const elementPlusResolver = () =>
    allElementPlusStyle ? ElementPlusResolver({ importStyle: false }) : ElementPlusResolver()
  const compressTypes = (env.VITE_COMPRESS || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item === 'gzip' || item === 'brotli')

  // 路径查找
  function pathResolve(dir: string) {
    return resolve(root, '.', dir)
  }

  const plugins = [
    Vue(),
    VueJsx(),
    UnoCSS(),
    // 为显式 import 的 Element Plus 组件注入按需样式；全量样式模式下不需要
    !allElementPlusStyle && ElementPlus({}),
    createElementPlusStylePlugin(env),
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/ // .md
      ],
      imports: [
        'vue',
        'vue-router',
        // 可额外添加需要 autoImport 的组件
        {
          '@/hooks/web/useI18n': ['useI18n'],
          '@/hooks/web/useMessage': ['useMessage'],
          '@/hooks/web/useTable': ['useTable'],
          '@/hooks/web/useCrudSchemas': ['useCrudSchemas'],
          '@/utils/formRules': ['required'],
          '@/utils/dict': ['DICT_TYPE']
        }
      ],
      dts: !isBuild && 'src/types/auto-imports.d.ts',
      resolvers: [elementPlusResolver()],
      eslintrc: {
        enabled: false, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      }
    }),
    Components({
      // 生成自定义 `auto-components.d.ts` 全局声明
      dts: !isBuild && 'src/types/auto-components.d.ts',
      // 自定义组件的解析器
      resolvers: [elementPlusResolver()],
      globs: ['src/components/**/**.{vue, md}', '!src/components/DiyEditor/components/mobile/**']
    }),
    createSvgIconsPlugin({
      iconDirs: [pathResolve('src/assets/svgs')],
      symbolId: 'icon-[dir]-[name]'
    }),
    // 离线图标子集：默认在线时只输出空模块，仅 VITE_USE_ONLINE_ICON=false 时生成
    createOfflineIconsPlugin(env),
    // dev 启动后复制服务地址：仅 dev 且 VITE_DEV_URL_COPY=local|network 时启用
    !isBuild && createUrlCopyPlugin(env),
    isBuild &&
      compressTypes.includes('gzip') &&
      viteCompression({
        verbose: true, // 是否在控制台输出压缩结果
        disable: false, // 是否禁用
        threshold: 10240, // 体积大于 threshold 才会被压缩,单位 b
        algorithm: 'gzip', // 压缩算法,可选 [ 'gzip' , 'brotliCompress' ,'deflate' , 'deflateRaw']
        ext: '.gz', // 生成的压缩包后缀
        deleteOriginFile: false //压缩后是否删除源文件
      }),
    isBuild &&
      compressTypes.includes('brotli') &&
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'brotliCompress',
        ext: '.br',
        deleteOriginFile: false
      }),
    // 打包体积分析：默认关闭，仅 build 且 VITE_USE_BUNDLE_ANALYZER=true 时生成离线报告；按官方建议放在最后
    isBuild &&
      env.VITE_USE_BUNDLE_ANALYZER === 'true' &&
      (visualizer({
        filename: resolve(root, 'output/bundle-analyzer/stats.html'),
        open: false
      }) as PluginOption)
  ]

  return plugins.filter(Boolean)
}
