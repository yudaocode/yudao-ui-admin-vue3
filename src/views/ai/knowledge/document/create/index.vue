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
          <span class="ml-10px text-16px truncate" :title="formData.name || '创建知识库文档'">
            {{ formData.name || '创建知识库文档' }}
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
import { useMessage } from '@/hooks/web/useMessage'
import { useTagsViewStore } from '@/store/modules/tagsView'
import UploadStep from './UploadStep.vue'
import SplitStep from './SplitStep.vue'
import ProcessStep from './ProcessStep.vue'

const router = useRouter()
const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
const message = useMessage()

// 组件引用
const uploadDocumentRef = ref()
const documentSegmentRef = ref()
const processCompleteRef = ref()

const currentStep = ref(0) // 步骤控制
const steps = [{ title: '上传文档' }, { title: '文档分段' }, { title: '处理并完成' }]

// 表单数据
const formData = ref({
  id: undefined,
  name: '',
  knowledgeBaseId: undefined,
  documentType: undefined,
  content: '',
  file: null,
  segments: [],
  status: 0 // 0: 草稿, 1: 处理中, 2: 已完成
})

/** 初始化数据 */
const initData = async () => {
  const documentId = route.params.id as string
  if (documentId) {
    // 修改场景
    // 这里需要调用API获取文档数据
    // formData.value = await DocumentApi.getDocument(documentId)
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

/** 保存操作 */
const handleSave = async () => {
  try {
    // 更新表单数据
    const documentData = {
      ...formData.value
    }

    if (formData.value.id) {
      // 修改场景
      // await DocumentApi.updateDocument(documentData)
      message.success('修改成功')
    } else {
      // 新增场景
      // formData.value.id = await DocumentApi.createDocument(documentData)
      message.success('新增成功')
      try {
        await message.confirm('创建文档成功，是否继续编辑？')
        // 用户点击继续编辑，跳转到编辑页面
        await nextTick()
        // 先删除当前页签
        delView(unref(router.currentRoute))
        // 跳转到编辑页面
        await router.push({
          name: 'AiKnowledgeDocumentUpdate',
          params: { id: formData.value.id }
        })
      } catch {
        // 先删除当前页签
        delView(unref(router.currentRoute))
        // 用户点击返回列表
        await router.push({ name: 'AiKnowledgeDocument' })
      }
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    message.warning(error.message || '请完善所有步骤的必填信息')
  }
}

/** 返回列表页 */
const handleBack = () => {
  // 先删除当前页签
  delView(unref(router.currentRoute))
  // 跳转到列表页
  router.push({ name: 'AiKnowledgeDocument' })
}

/** 初始化 */
onMounted(async () => {
  await initData()
})

// 提供parent给子组件使用
provide('parent', getCurrentInstance())

// 添加组件卸载前的清理代码
onBeforeUnmount(() => {
  // 清理所有的引用
  uploadDocumentRef.value = null
  documentSegmentRef.value = null
  processCompleteRef.value = null
})

// 暴露方法给子组件使用
defineExpose({
  goToNextStep,
  goToPrevStep,
  handleSave
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
