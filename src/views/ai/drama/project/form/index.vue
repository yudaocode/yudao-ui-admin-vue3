<!-- AI 短剧：项目表单，新建、查看、编辑共用；按 想法 → 剧本 → 资产 → 分镜与成片 分步；步骤只在前端，进入时按项目进度推断 -->
<template>
  <ContentWrap>
    <div class="flex items-center justify-between gap-12px">
      <div class="min-w-0 flex items-center gap-8px">
        <el-button link @click="close"><Icon icon="ep:arrow-left" class="mr-4px" /> 返回</el-button>
        <span class="truncate text-16px font-600">
          {{ isCreate ? '新建短剧' : detail?.project.name || '加载中' }}
        </span>
        <template v-if="detail">
          <el-tag size="small" type="info">{{ detail.project.composeAspectRatio }}</el-tag>
          <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="detail.project.status" />
        </template>
        <span v-if="running" class="text-12px text-[var(--el-text-color-secondary)]">
          生成中，自动刷新
        </span>
      </div>
      <div v-if="!isCreate" class="flex items-center gap-8px">
        <el-button :type="canvasVisible ? 'primary' : 'default'" plain @click="handleCanvasToggle">
          <Icon icon="ep:share" class="mr-5px" /> {{ canvasVisible ? '返回分步' : '画布' }}
        </el-button>
        <el-button :loading="loading" @click="loadDetail">
          <Icon icon="ep:refresh" class="mr-5px" /> 刷新
        </el-button>
      </div>
    </div>
    <el-steps
      v-if="!canvasVisible"
      :active="stepIndex"
      finish-status="success"
      simple
      class="mt-12px"
    >
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
    <DramaCanvas
      v-else-if="detail && canvasVisible"
      ref="canvasRef"
      :detail="detail"
      @refresh="loadDetail"
    />
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
import { DICT_TYPE } from '@/utils/dict'
import { AiDramaStepEnum } from '@/views/ai/utils/constants'
import { getDramaStep, hasDramaRunning } from '@/views/ai/utils/drama'
import IdeaStep from './IdeaStep.vue'
import ScriptStep from './ScriptStep.vue'
import AssetStep from './AssetStep.vue'
import StoryboardStep from './StoryboardStep.vue'

// 画布：点击「画布」时再加载
const DramaCanvas = defineAsyncComponent(() => import('../canvas/index.vue'))

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

/** 加载项目详情：首次加载时按项目的进度推断步骤 */
const loadDetail = async () => {
  loading.value = true
  try {
    const data = await DramaProjectApi.getProjectDetailMy(projectId!)
    if (!detail.value) {
      step.value = getDramaStep(data)
    }
    detail.value = data
  } finally {
    loading.value = false
  }
}

/** 切换步骤：只在前端切换，并刷新详情 */
const goStep = async (value: number) => {
  step.value = value
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

/** 切换画布、分步：画布有未保存的修改时确认 */
const canvasVisible = ref(false)
const canvasRef = ref()
const handleCanvasToggle = async () => {
  if (canvasVisible.value && canvasRef.value?.dirty) {
    try {
      await message.confirm('画布有未保存的修改，确认离开？')
    } catch {
      return
    }
  }
  canvasVisible.value = !canvasVisible.value
  if (!canvasVisible.value) {
    await loadDetail()
  }
}

/** 返回项目列表 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'AiDrama' })
}

/** 新建完成：关闭新建页，进入该项目；进入后按项目进度推断步骤 */
const handleCreated = async (id: number) => {
  delView(unref(currentRoute))
  await push({ name: 'AiDramaProject', params: { id } })
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
// DONE @AI：按道理来说，应该是 project/index，project/form/index 这样的格式呀？（列表移到 drama/project/index.vue，工作台移到 drama/project/form/index.vue，四个步骤组件及其弹窗、抽屉同目录（同 mall/product/spu/form），与短剧管理共用的 AssetImage 在 drama/components；菜单组件路径同步改为 ai/drama/project/index.vue；路由地址 /ai/drama/project/:id、路由名不变）
</script>
