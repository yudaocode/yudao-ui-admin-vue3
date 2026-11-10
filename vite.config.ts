import {dirname, relative, resolve} from 'path'
import type {ConfigEnv, UserConfig} from 'vite'
import {loadEnv, normalizePath} from 'vite'
import {createVitePlugins} from './build/vite'
import {exclude, include} from "./build/vite/optimize"
// 当前执行node命令时文件夹的地址(工作目录)
const root = process.cwd()

// 路径查找
function pathResolve(dir: string) {
    return resolve(root, '.', dir)
}

function getRelativeScssUsePath(filename: string, targetPath: string) {
    const cleanFilename = filename.split('?')[0]
    const relativePath = normalizePath(relative(dirname(cleanFilename), targetPath))
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
}

// https://vitejs.dev/config/
export default ({command, mode}: ConfigEnv): UserConfig => {
    const isBuild = command === 'build'
    // 统一使用 Vite 解析后的 mode（参考上游 61d7ef642 的环境模式选择），兼容 --mode=x、--host 在前等任意参数顺序
    const env = loadEnv(mode, root) as any
    const variablesScssPath = pathResolve('src/styles/variables.scss')
    // CSS 产物目标（参考上游 4b43c8794）：VITE_CSS_TARGET 为逗号分隔的目标（如 chrome87,safari14），设置时用于 CSS 转换与压缩，
    // 避免 autoprefixer 加的前缀按默认现代目标被剔除；未设置保持 Vite 默认。只影响 CSS，不代表 JS 及依赖兼容这些浏览器；无效目标构建报错
    const cssTarget = String(env.VITE_CSS_TARGET || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    return {
        base: env.VITE_BASE_PATH,
        root: root,
        // 服务端渲染
        server: {
            port: env.VITE_PORT, // 端口号
            host: "0.0.0.0",
            open: env.VITE_OPEN === 'true',
            // 本地跨域代理. 目前注释的原因：暂时没有用途，server 端已经支持跨域
            // proxy: {
            //   ['/admin-api']: {
            //     target: env.VITE_BASE_URL,
            //     ws: false,
            //     changeOrigin: true,
            //     rewrite: (path) => path.replace(new RegExp(`^/admin-api`), ''),
            //   },
            // },
        },
        // 项目使用的vite插件。 单独提取到build/vite/plugin中管理
        plugins: createVitePlugins(isBuild, env),
        css: {
            lightningcss: {
                // Preserve legacy star-hack declarations by stripping invalid syntax during minification.
                errorRecovery: true
            },
            preprocessorOptions: {
                scss: {
                    additionalData: (source: string, filename: string) => {
                        const normalizedFilename = normalizePath(filename)
                        // Windows 下更容易触发重复注入：定义或显式转导变量的文件，不能再次注入同一个
                        // `@use ... as *`，否则 Sass 会报 duplicate global variables。
                        if (
                            normalizedFilename.endsWith('/src/styles/variables.scss') ||
                            normalizedFilename.endsWith('/src/styles/global.module.scss')
                        ) {
                            return source
                        }
                        return `@use "${getRelativeScssUsePath(filename, variablesScssPath)}" as *;\n${source}`
                    },
                    api: 'modern-compiler'
                }
            }
        },
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss', '.css'],
            alias: [
                {
                    find: /\@\//,
                    replacement: `${pathResolve('src')}/`
                }
            ]
        },
        build: {
            chunkSizeWarningLimit: 2000,
            minify: 'oxc',
            outDir: env.VITE_OUT_DIR || 'dist',
            reportCompressedSize: false,
            // 参考上游 3a5db42c9：开启时生成独立的 .map 文件，不再内联进产物 JS
            sourcemap: env.VITE_SOURCEMAP === 'true',
            // CSS 分包开关（参考上游 b2cee10cc）：未配置时保持现有按 chunk 拆分 CSS，仅 VITE_USE_CSS_SPLIT=false 时合并为单个 CSS 文件
            cssCodeSplit: env.VITE_USE_CSS_SPLIT !== 'false',
            ...(cssTarget.length ? {cssTarget} : {}),
            rollupOptions: {
                output: {
                    minify: {
                        compress: {
                            dropDebugger: env.VITE_DROP_DEBUGGER === 'true',
                            dropConsole: env.VITE_DROP_CONSOLE === 'true'
                        }
                    },
                    codeSplitting: {
                        // 目标：ECharts、表单渲染/设计器等重库随使用它们的页面加载，避免阻塞不使用它们的页面；
                        // vendor-initial 只减少入口已静态依赖的第三方包的请求碎片，并不是把异步重库合进入口
                        groups: [
                            // ECharts 及其渲染引擎 zrender 各自独立成 chunk（参考上游 28901407f）。priority 高于 vendor-initial，避免被其兜底规则吞掉；
                            // includeDependenciesRecursively 只对这两组关闭，防止 echarts 组把依赖 zrender 一并收入，vendor-initial 仍保持默认行为
                            { name: 'zrender', test: /node_modules[\\/]zrender[\\/]/, priority: 10, includeDependenciesRecursively: false },
                            { name: 'echarts', test: /node_modules[\\/]echarts[\\/]/, priority: 10, includeDependenciesRecursively: false },
                            { name: 'vendor-initial', test: /node_modules[\\/]/, tags: ['$initial'] } // 仅合并入口静态依赖链上的第三方模块，避免 Element Plus 等被拆成大量小文件；路由异步依赖不受影响
                        ]
                    }
                },
            },
        },
        optimizeDeps: {include, exclude}
    }
}
