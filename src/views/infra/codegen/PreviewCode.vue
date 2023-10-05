<template>
  <Dialog
    v-model="dialogVisible"
    align-center
    class="app-infra-codegen-preview-container"
    title="代码预览"
    width="80%"
  >
    <div class="flex">
      <!-- 代码目录树 -->
      <el-card
        v-loading="loading"
        :gutter="12"
        class="w-1/3"
        element-loading-text="生成文件目录中..."
        shadow="hover"
      >
        <el-scrollbar height="calc(100vh - 88px - 40px)">
          <el-tree
            ref="treeRef"
            :data="preview.fileTree"
            :expand-on-click-node="false"
            highlight-current
            default-expand-all
            node-key="id"
            @node-click="handleNodeClick"
          />
        </el-scrollbar>
      </el-card>
      <!-- 代码 -->
      <el-card
        v-loading="loading"
        :gutter="12"
        class="ml-3 w-2/3"
        element-loading-text="加载代码中..."
        shadow="hover"
      >
        <el-tabs v-model="preview.activeName">
          <el-tab-pane
            v-for="item in previewCodegen"
            :key="item.filePath"
            :label="item.filePath.substring(item.filePath.lastIndexOf('/') + 1)"
            :name="item.filePath"
          >
            <el-button class="float-right" text type="primary" @click="copy(item.code)">
              {{ t('common.copy') }}
            </el-button>
            <el-scrollbar height="600px">
              <pre><code v-dompurify-html="highlightedCode(item)" class="hljs"></code></pre>
            </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </Dialog>
</template>
<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'
import { handleTree2 } from '@/utils/tree'
import * as CodegenApi from '@/api/infra/codegen'

import hljs from 'highlight.js' // 导入代码高亮文件
import 'highlight.js/styles/github.css' // 导入代码高亮样式
import java from 'highlight.js/lib/languages/java'
import xml from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'

defineOptions({ name: 'InfraCodegenPreviewCode' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 加载中的状态
const preview = reactive({
  fileTree: [], // 文件树
  activeName: '' // 激活的文件名
})
const previewCodegen = ref<CodegenApi.CodegenPreviewVO[]>()

/** 点击文件 */
const handleNodeClick = async (data, node) => {
  if (node && !node.isLeaf) {
    return false
  }
  preview.activeName = data.id
}

/** 生成 files 目录 **/
interface filesType {
  id: string
  label: string
  parentId: string
}

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  try {
    loading.value = true
    // 生成代码
    const data = await CodegenApi.previewCodegen(id)
    previewCodegen.value = data
    // 处理文件
    let file = handleFiles(data)
    preview.fileTree = handleTree2(file, 'id', 'parentId', 'children', '/')
    // 点击首个文件
    preview.activeName = data[0].filePath
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 处理文件 */
const handleFiles = (datas: CodegenApi.CodegenPreviewVO[]) => {
  let exists = {} // key：file 的 id；value：true
  let files: filesType[] = []
  // 遍历每个元素
  for (const data of datas) {
    let paths = data.filePath.split('/')
    let fullPath = '' // 从头开始的路径，用于生成 id
    // 特殊处理 java 文件
    if (paths[paths.length - 1].indexOf('.java') >= 0) {
      let newPaths: string[] = []
      for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        if (path !== 'java') {
          newPaths.push(path)
          continue
        }
        newPaths.push(path)
        // 特殊处理中间的 package，进行合并
        let tmp = ''
        while (i < paths.length) {
          path = paths[i + 1]
          if (
            path === 'controller' ||
            path === 'convert' ||
            path === 'dal' ||
            path === 'enums' ||
            path === 'service' ||
            path === 'vo' || // 下面三个，主要是兜底。可能考虑到有人改了包结构
            path === 'mysql' ||
            path === 'dataobject'
          ) {
            break
          }
          tmp = tmp ? tmp + '.' + path : path
          i++
        }
        if (tmp) {
          newPaths.push(tmp)
        }
      }
      paths = newPaths
    }
    // 遍历每个 path， 拼接成树
    for (let i = 0; i < paths.length; i++) {
      // 已经添加到 files 中，则跳过
      let oldFullPath = fullPath
      // 下面的 replaceAll 的原因，是因为上面包处理了，导致和 tabs 不匹配，所以 replaceAll 下
      fullPath = fullPath.length === 0 ? paths[i] : fullPath.replaceAll('.', '/') + '/' + paths[i]
      if (exists[fullPath]) {
        continue
      }
      // 添加到 files 中
      exists[fullPath] = true
      files.push({
        id: fullPath,
        label: paths[i],
        parentId: oldFullPath || '/' // "/" 为根节点
      })
    }
  }
  return files
}

/** 复制 **/
const copy = async (text: string) => {
  const { copy, copied, isSupported } = useClipboard({ source: text })
  if (!isSupported) {
    message.error(t('common.copyError'))
    return
  }
  await copy()
  if (unref(copied)) {
    message.success(t('common.copySuccess'))
  }
}

/**
 * 代码高亮
 */
const highlightedCode = (item) => {
  const language = item.filePath.substring(item.filePath.lastIndexOf('.') + 1)
  const result = hljs.highlight(language, item.code || '', true)
  return result.value || '&nbsp;'
}

/** 初始化 **/
onMounted(async () => {
  // 注册代码高亮的各种语言
  hljs.registerLanguage('java', java)
  hljs.registerLanguage('xml', xml)
  hljs.registerLanguage('html', xml)
  hljs.registerLanguage('vue', xml)
  hljs.registerLanguage('javascript', javascript)
  hljs.registerLanguage('sql', sql)
  hljs.registerLanguage('typescript', typescript)
})
</script>
<style lang="scss">
.app-infra-codegen-preview-container {
  .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view {
    display: inline-block;
    white-space: nowrap;
  }
}
</style>
