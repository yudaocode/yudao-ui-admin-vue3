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
    let env = {} as any
    const isBuild = command === 'build'
    if (!isBuild) {
        env = loadEnv((process.argv[3] === '--mode' ? process.argv[4] : process.argv[3]), root)
    } else {
        env = loadEnv(mode, root)
    }
    const variablesScssPath = pathResolve('src/styles/variables.scss')
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
            sourcemap: env.VITE_SOURCEMAP === 'true' ? 'inline' : false,
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
                            { name: 'vendor-initial', test: /node_modules[\\/]/, tags: ['$initial'] } // 仅合并入口静态依赖链上的第三方模块，避免 Element Plus 等被拆成大量小文件；路由异步依赖不受影响
                        ]
                    }
                },
            },
        },
        optimizeDeps: {include, exclude}
    }
}
