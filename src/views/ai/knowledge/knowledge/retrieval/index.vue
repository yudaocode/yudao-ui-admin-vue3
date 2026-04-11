<template>
  <div class="flex gap-20px w-full">
    <!-- 左侧输入区域 -->
    <ContentWrap class="flex-1 min-w-300px">
      <div class="mb-15px">
        <h3 class="m-0 mb-5px">召回测试</h3>
        <div class="text-gray-500 text-14px">根据给定的查询文本测试召回效果。</div>
      </div>
      <div>
        <div class="relative mb-10px">
          <el-input
            v-model="queryParams.content"
            type="textarea"
            :rows="8"
            placeholder="请输入文本"
          />
          <div class="absolute bottom-10px right-10px text-gray-400 text-12px">
            {{ queryParams.content?.length }} / 200
          </div>
        </div>
        <div class="flex items-center mb-10px">
          <span class="w-60px text-gray-500">topK:</span>
          <el-input-number v-model="queryParams.topK" :min="1" :max="20" />
        </div>
        <div class="flex items-center mb-15px">
          <span class="w-60px text-gray-500">相似度:</span>
          <el-input-number
            v-model="queryParams.similarityThreshold"
            :min="0"
            :max="1"
            :precision="2"
            :step="0.01"
          />
        </div>
        <div class="flex justify-end">
          <el-button type="primary" @click="getRetrievalResult" :loading="loading">测试</el-button>
        </div>
      </div>
    </ContentWrap>

    <!-- 右侧召回结果区域 -->
    <ContentWrap class="flex-1 min-w-300px">
      <el-empty v-if="loading" description="正在检索中..." />
      <div v-else-if="segments.length > 0" class="font-bold mb-15px">
        {{ segments.length }} 个召回段落
      </div>
      <el-empty v-else description="暂无召回结果" />
      <div>
        <div
          v-for="(segment, index) in segments"
          :key="index"
          class="mb-20px border border-solid border-gray-200 rounded p-15px"
        >
          <div class="flex justify-between text-12px text-gray-500 mb-5px">
            <span>
              分段({{ segment.id }}) · {{ segment.contentLength }} 字符数 ·
              {{ segment.tokens }} Token
            </span>
            <span class="px-8px py-4px bg-blue-50 text-blue-500 rounded-full text-12px font-bold">
              score: {{ segment.score }}
            </span>
          </div>
          <div
            class="bg-gray-50 p-10px rounded mb-10px whitespace-pre-wrap overflow-hidden transition-all duration-100 text-13px"
            :class="{
              'line-clamp-2 max-h-50px': !segment.expanded,
              'max-h-500px': segment.expanded
            }"
          >
            {{ segment.content }}
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center text-gray-500 text-13px">
              <Icon icon="ep:document" class="mr-5px" />
              <span>{{ segment.documentName || '未知文档' }}</span>
            </div>
            <el-button size="small" @click="toggleExpand(segment)">
              {{ segment.expanded ? '收起' : '展开' }}
              <Icon :icon="segment.expanded ? 'ep:arrow-up' : 'ep:arrow-down'" />
            </el-button>
          </div>
        </div>
      </div>
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from '@/hooks/web/useMessage'
import { KnowledgeSegmentApi } from '@/api/ai/knowledge/segment'
import { KnowledgeApi } from '@/api/ai/knowledge/knowledge'
/** 文档召回测试 */
defineOptions({ name: 'KnowledgeDocumentRetrieval' })

const message = useMessage() // 消息弹窗
const route = useRoute() // 路由
const router = useRouter() // 路由

const loading = ref(false) // 加载状态
const segments = ref<any[]>([]) // 召回结果
const queryParams = reactive({
  id: undefined,
  content: '',
  topK: 10,
  similarityThreshold: 0.5
})

/** 调用文档召回测试接口 */
const getRetrievalResult = async () => {
  if (!queryParams.content) {
    message.warning('请输入查询文本')
    return
  }

  loading.value = true
  segments.value = []

  try {
    const data = await KnowledgeSegmentApi.searchKnowledgeSegment({
      knowledgeId: queryParams.id,
      content: queryParams.content,
      topK: queryParams.topK,
      similarityThreshold: queryParams.similarityThreshold
    })
    segments.value = data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

/** 展开/收起段落内容 */
const toggleExpand = (segment: any) => {
  segment.expanded = !segment.expanded
}

/** 获取知识库信息 */
const getKnowledgeInfo = async (id: number) => {
  try {
    const knowledge = await KnowledgeApi.getKnowledge(id)
    if (knowledge) {
      queryParams.topK = knowledge.topK || queryParams.topK
      queryParams.similarityThreshold =
        knowledge.similarityThreshold || queryParams.similarityThreshold
    }
  } catch (error) {}
}

/** 初始化 **/
onMounted(() => {
  // 如果知识库 ID 不存在，显示错误提示并关闭页面
  if (!route.query.id) {
    message.error('知识库 ID 不存在，无法进行召回测试')
    router.back()
    return
  }
  queryParams.id = route.query.id as any

  // 获取知识库信息并设置默认值
  getKnowledgeInfo(queryParams.id as any)
})
</script>
