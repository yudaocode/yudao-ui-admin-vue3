<template>
  <ContentWrap>
    <div class="mx-auto">
      <!-- 头部导航栏 -->
      <div
        class="absolute top-0 left-0 right-0 h-50px bg-white border-bottom z-10 flex items-center px-20px"
      >
        <!-- 左侧标题 -->
        <div class="w-200px flex items-center overflow-hidden">
          <Icon icon="ep:arrow-left" class="cursor-pointer flex-shrink-0" @click="handleBack" />
          <span class="ml-10px text-16px truncate">
            {{ formData.id ? '编辑知识库文档' : '创建知识库文档' }}
          </span>
        </div>

        <!-- 步骤条 -->
        <div class="flex-1 flex items-center justify-center h-full">
          <div class="w-400px flex items-center justify-between h-full">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="flex items-center mx-15px relative h-full"
              :class="[
                currentStep === index
                  ? 'text-[#3473ff] border-[#3473ff] border-b-2 border-b-solid'
                  : 'text-gray-500'
              ]"
            >
              <div
                class="w-28px h-28px rounded-full flex items-center justify-center mr-8px border-2 border-solid text-15px"
                :class="[
                  currentStep === index
                    ? 'bg-[#3473ff] text-white border-[#3473ff]'
                    : 'border-gray-300 bg-white text-gray-500'
                ]"
              >
                {{ index + 1 }}
              </div>
              <span class="text-16px font-bold whitespace-nowrap">{{ step.title }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧按钮 - 已移除 -->
        <div class="w-200px flex items-center justify-end gap-2"> </div>
      </div>

      <!-- 主体内容 -->
      <div class="mt-50px">
        <!-- 第一步：上传文档 -->
        <div v-if="currentStep === 0" class="mx-auto w-560px">
          <UploadStep v-model="formData" ref="uploadDocumentRef" />
        </div>

        <!-- 第二步：文档分段 -->
        <div v-if="currentStep === 1" class="mx-auto w-560px">
          <SplitStep v-model="formData" ref="documentSegmentRef" />
        </div>

        <!-- 第三步：处理并完成 -->
        <div v-if="currentStep === 2" class="mx-auto w-560px">
          <ProcessStep v-model="formData" ref="processCompleteRef" />
        </div>
      </div>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '@/store/modules/tagsView'
import UploadStep from './UploadStep.vue'
import SplitStep from './SplitStep.vue'
import ProcessStep from './ProcessStep.vue'
import { KnowledgeDocumentApi } from '@/api/ai/knowledge/document'

const { delView } = useTagsViewStore() // 视图操作
const route = useRoute() // 路由
const router = useRouter() // 路由

// 组件引用
const uploadDocumentRef = ref()
const documentSegmentRef = ref()
const processCompleteRef = ref()
const currentStep = ref(0) // 步骤控制
const steps = [{ title: '上传文档' }, { title: '文档分段' }, { title: '处理并完成' }]
const formData = ref({
  knowledgeId: undefined, // 知识库编号
  id: undefined, // 编辑的文档编号(documentId)
  segmentMaxTokens: 500, // 分段最大 token 数
  list: [] as Array<{
    id: number // 文档编号
    name: string // 文档名称
    url: string // 文档 URL
    segments: Array<{
      content?: string
      contentLength?: number
      tokens?: number
    }>
    count?: number // 段落数量
    process?: number // 处理进度
  }> // 用于存储上传的文件列表
}) // 表单数据

provide('parent', getCurrentInstance()) // 提供 parent 给子组件使用

/** 初始化数据 */
const initData = async () => {
  // 【新增场景】从路由参数中获取知识库 ID
  if (route.query.knowledgeId) {
    formData.value.knowledgeId = route.query.knowledgeId as any
  }

  // 【修改场景】从路由参数中获取文档 ID
  const documentId = route.query.id
  if (documentId) {
    // 获取文档信息
    formData.value.id = documentId as any
    const document = await KnowledgeDocumentApi.getKnowledgeDocument(documentId as any)
    formData.value.segmentMaxTokens = document.segmentMaxTokens
    formData.value.list = [
      {
        id: document.id,
        name: document.name,
        url: document.url,
        segments: []
      }
    ]
    // 进入下一步
    goToNextStep()
  }
}

/** 切换到下一步 */
const goToNextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

/** 切换到上一步 */
const goToPrevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

/** 返回列表页 */
const handleBack = () => {
  // 先删除当前页签
  delView(unref(router.currentRoute))
  // 跳转到列表页
  router.push({ name: 'AiKnowledgeDocument', query: { knowledgeId: formData.value.knowledgeId } })
}

/** 初始化 */
onMounted(async () => {
  await initData()
})

/** 添加组件卸载前的清理代码 */
onBeforeUnmount(() => {
  // 清理所有的引用
  uploadDocumentRef.value = null
  documentSegmentRef.value = null
  processCompleteRef.value = null
})

/** 暴露方法给子组件使用 */
defineExpose({
  goToNextStep,
  goToPrevStep,
  handleBack
})
</script>

<style lang="scss" scoped>
.border-bottom {
  border-bottom: 1px solid #dcdfe6;
}

.text-primary {
  color: #3473ff;
}

.bg-primary {
  background-color: #3473ff;
}

.border-primary {
  border-color: #3473ff;
}
</style>
