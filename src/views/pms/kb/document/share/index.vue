<template>
  <div v-loading="loading" class="min-h-100vh bg-[var(--el-bg-color-page)] px-24px py-24px">
    <el-card
      v-if="document"
      :body-style="{ padding: '40px 48px' }"
      class="mx-auto min-h-[calc(100vh-48px)] max-w-960px"
      shadow="never"
    >
      <div
        v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
        v-dompurify-html="document.content || '<p>暂无内容</p>'"
        class="knowledge-share-content"
      ></div>
      <div v-else class="min-h-240px">
        <div class="mb-24px text-24px font-600 leading-[1.4]">{{ document.title }}</div>
        <div class="min-h-180px">
          <FilePreview
            v-if="document.previewUrl"
            :downloadable="false"
            :file-name="document.title"
            :file-type="document.fileType"
            :url="document.previewUrl"
          />
          <el-empty v-else description="文件未上传" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentShareApi from '@/api/pms/kb/interaction/share'
import { FilePreview } from '@/components/FilePreview'
import { PmsKnowledgeDocumentType } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeDocumentShare' })

const route = useRoute() // 当前路由
const loading = ref(false) // 数据加载中
const document = ref<KnowledgeDocumentShareApi.PmsKnowledgeDocumentSharePublicVO>() // 共享文档详情

/** 获得共享文档详情 */
async function getDocument() {
  loading.value = true
  try {
    document.value = await KnowledgeDocumentShareApi.getPublicKnowledgeDocument(
      String(route.params.token)
    )
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDocument()
})
</script>

<style lang="scss" scoped>
.knowledge-share-content {
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.8;
  overflow-wrap: anywhere;

  :deep(h1) {
    margin: 0 0 20px;
    font-size: 28px;
    line-height: 1.4;
  }

  :deep(h2) {
    margin: 24px 0 14px;
    font-size: 22px;
    line-height: 1.4;
  }

  :deep(h3) {
    margin: 20px 0 12px;
    font-size: 18px;
  }

  :deep(p) {
    margin: 0 0 14px;
  }

  :deep(img) {
    height: auto;
    max-width: 100%;
  }
}
</style>
