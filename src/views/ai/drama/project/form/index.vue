<!-- AI 短剧：项目表单，新建、查看、编辑共用；按 想法 → 剧本 → 资产 → 分镜与成片 分步；独立路由，刷新后按项目的当前步骤恢复 -->
<template>
  <ContentWrap>
    <div class="flex items-center justify-between gap-12px">
      <div class="min-w-0 flex items-center gap-8px">
        <el-button link @click="close"><Icon icon="ep:arrow-left" class="mr-4px" /> 返回</el-button>
        <span class="truncate text-16px font-600">
          {{ isCreate ? '新建短剧' : detail?.project.name || '加载中' }}
        </span>
        <el-tag v-if="detail" size="small" type="info">{{ detail.project.aspectRatio }}</el-tag>
        <span v-if="running" class="text-12px text-[var(--el-text-color-secondary)]">
          生成中，自动刷新
        </span>
      </div>
      <el-button v-if="!isCreate" :loading="loading" @click="loadDetail">
        <Icon icon="ep:refresh" class="mr-5px" /> 刷新
      </el-button>
    </div>
    <el-steps :active="stepIndex" finish-status="success" simple class="mt-12px">
      <el-step
        v-for="(item, index) in STEPS"
        :key="item.value"
        :title="item.label"
        class="cursor-pointer"
        @click="handleStepChange(index)"
      />
    </el-steps>
  </ContentWrap>

  <div v-loading="loading && !detail">
    <!-- 新建：只有第 1 步，保存后进入该项目 -->
    <IdeaStep v-if="isCreate" @created="handleCreated" />
    <template v-else-if="detail">
      <IdeaStep
        v-if="step === AiDramaStepEnum.IDEA"
        :detail="detail"
        @refresh="loadDetail"
        @next="goStep"
      />
      <ScriptStep
        v-else-if="step === AiDramaStepEnum.SCRIPT"
        :detail="detail"
        @refresh="loadDetail"
        @next="goStep"
      />
      <AssetStep
        v-else-if="step === AiDramaStepEnum.ASSET"
        :detail="detail"
        @refresh="loadDetail"
        @next="goStep"
      />
      <StoryboardStep v-else :detail="detail" @refresh="loadDetail" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { parseId } from '@/utils/id'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { AiDramaStepEnum } from '@/views/ai/utils/constants'
import { hasDramaRunning } from '@/views/ai/utils/drama'
import IdeaStep from './IdeaStep.vue'
import ScriptStep from './ScriptStep.vue'
import AssetStep from './AssetStep.vue'
import StoryboardStep from './StoryboardStep.vue'

/** AI 短剧：项目表单 */
defineOptions({ name: 'AiDramaProject' })

const message = useMessage() // 消息弹窗
const { params, name: routeName } = useRoute() // 路由参数

const isCreate = routeName === 'AiDramaProjectCreate' // 是否新建
const projectId = parseId(params.id) // 项目编号

const STEPS = [
  { label: '故事想法', value: AiDramaStepEnum.IDEA },
  { label: '剧本审阅', value: AiDramaStepEnum.SCRIPT },
  { label: '资产配置', value: AiDramaStepEnum.ASSET },
  { label: '分镜与成片', value: AiDramaStepEnum.STORYBOARD }
]
const POLL_INTERVAL = 5000 // 生成中的轮询间隔（毫秒）

const loading = ref(false)
const detail = ref<DramaProjectDetailVO>()
const step = ref<number>(AiDramaStepEnum.IDEA)
const stepIndex = computed(() => STEPS.findIndex((item) => item.value === step.value))
const running = computed(() => hasDramaRunning(detail.value))

/** 加载项目详情：首次加载时按项目的当前步骤恢复 */
const loadDetail = async () => {
  loading.value = true
  try {
    const data = await DramaProjectApi.getProjectDetailMy(projectId!)
    if (!detail.value) {
      step.value = data.project.status || AiDramaStepEnum.IDEA
    }
    detail.value = data
  } finally {
    loading.value = false
  }
}

/** 切换步骤：记录到项目，刷新、下次进入时恢复 */
const goStep = async (value: number) => {
  step.value = value
  await DramaProjectApi.updateProjectStatusMy(projectId!, value)
  await loadDetail()
}

const handleStepChange = (index: number) => {
  if (STEPS[index].value === step.value) {
    return
  }
  if (isCreate) {
    message.warning('请先保存故事想法')
    return
  }
  goStep(STEPS[index].value)
}

/** 返回项目列表 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'AiDrama' })
}

/** 新建完成：记录要进入的步骤，关闭新建页，进入该项目 */
const handleCreated = async (id: number, value: number) => {
  try {
    if (value !== AiDramaStepEnum.IDEA) {
      await DramaProjectApi.updateProjectStatusMy(id, value)
    }
  } finally {
    // 记录步骤失败时，也进入已创建的项目，不留在新建页
    delView(unref(currentRoute))
    await push({ name: 'AiDramaProject', params: { id } })
  }
}

// 生成中时轮询；静默刷新，不显示加载中
let timer: ReturnType<typeof setInterval> | undefined
const stopPolling = () => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}
watch(running, (value) => {
  stopPolling()
  if (value) {
    timer = setInterval(async () => {
      detail.value = await DramaProjectApi.getProjectDetailMy(projectId!)
    }, POLL_INTERVAL)
  }
})

/** 初始化 **/
onMounted(() => {
  if (isCreate) {
    return
  }
  if (!projectId) {
    message.warning('参数错误，项目不能为空！')
    close()
    return
  }
  loadDetail()
})
onBeforeUnmount(() => {
  stopPolling()
})
// DONE @AI：按道理来说，应该是 project/index，project/form/index 这样的格式呀？（列表移到 drama/project/index.vue，工作台移到 drama/project/form/index.vue，四个步骤组件同目录，弹窗等组件在 drama/project/components；菜单组件路径同步改为 ai/drama/project/index.vue；路由地址 /ai/drama/project/:id、路由名不变）
</script>
