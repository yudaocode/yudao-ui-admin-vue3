<template>
  <doc-alert title="数据库文档" url="https://doc.iocoder.cn/db-doc/" />

  <ContentWrap title="数据库文档">
    <div class="mb-10px">
      <el-button type="primary" plain @click="handleExport('HTML')">
        <Icon icon="ep:download" /> 导出 HTML
      </el-button>
      <el-button type="primary" plain @click="handleExport('Word')">
        <Icon icon="ep:download" /> 导出 Word
      </el-button>
      <el-button type="primary" plain @click="handleExport('Markdown')">
        <Icon icon="ep:download" /> 导出 Markdown
      </el-button>
    </div>
    <IFrame v-if="!loading" v-loading="loading" :src="src" />
  </ContentWrap>
</template>
<script setup lang="ts" name="InfraDBDoc">
import download from '@/utils/download'
import * as DbDocApi from '@/api/infra/dbDoc'

const loading = ref(true) // 是否加载中
const src = ref('') // HTML 的地址

/** 页面加载 */
const init = async () => {
  try {
    const data = await DbDocApi.exportHtml()
    const blob = new Blob([data], { type: 'text/html' })
    src.value = window.URL.createObjectURL(blob)
  } finally {
    loading.value = false
  }
}

/** 处理导出  */
const handleExport = async (type: string) => {
  if (type === 'HTML') {
    const res = await DbDocApi.exportHtml()
    download.html(res, '数据库文档.html')
  }
  if (type === 'Word') {
    const res = await DbDocApi.exportWord()
    download.word(res, '数据库文档.doc')
  }
  if (type === 'Markdown') {
    const res = await DbDocApi.exportMarkdown()
    download.markdown(res, '数据库文档.md')
  }
}

/** 初始化 */
onMounted(async () => {
  await init()
})
</script>
