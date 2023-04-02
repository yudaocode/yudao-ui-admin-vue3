<template>
  <Dialog
    title="代码预览"
    v-model="modelVisible"
    align-center
    width="80%"
    class="app-infra-codegen-preview-container"
  >
    <div class="flex">
      <!-- 代码目录树 -->
      <el-card
        class="w-1/3"
        :gutter="12"
        shadow="hover"
        v-loading="loading"
        element-loading-text="生成文件目录中..."
      >
        <el-scrollbar height="calc(100vh - 88px - 40px - 50px)">
          <el-tree
            ref="treeRef"
            node-key="id"
            :data="preview.fileTree"
            :expand-on-click-node="false"
            highlight-current
            @node-click="handleNodeClick"
            default-expand-all
          />
        </el-scrollbar>
      </el-card>
      <!-- 代码 -->
      <el-card
        class="w-2/3 ml-3"
        :gutter="12"
        shadow="hover"
        v-loading="loading"
        element-loading-text="加载代码中..."
      >
        <el-tabs v-model="preview.activeName">
          <el-tab-pane
            v-for="item in previewCodegen"
            :label="item.filePath.substring(item.filePath.lastIndexOf('/') + 1)"
            :name="item.filePath"
            :key="item.filePath"
          >
            <el-button text type="primary" class="float-right" @click="copy(item.code)">
              {{ t('common.copy') }}
            </el-button>
            <div v-highlight>
              <code>{{ item.code }}</code>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </Dialog>
</template>
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { handleTree2 } from '@/utils/tree'
import * as CodegenApi from '@/api/infra/codegen'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
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
  modelVisible.value = true
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
</script>
<style lang="scss">
.app-infra-codegen-preview-container {
  .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view {
    white-space: nowrap;
    display: inline-block;
  }
}
</style>
