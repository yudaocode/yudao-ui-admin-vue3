<!-- AI 短剧：规划分镜并审阅；规划结果不保存，可多次规划对比，确认后导入替换当前剧本的分镜 -->
<template>
  <Dialog v-model="dialogVisible" title="规划分镜" width="1100px">
    <div class="mb-12px flex flex-wrap items-center gap-12px">
      <el-radio-group v-if="candidates.length" v-model="candidateIndex">
        <el-radio-button v-for="(item, index) in candidates" :key="index" :value="index">
          方案 {{ index + 1 }}（{{ item.length }} 镜）
        </el-radio-button>
      </el-radio-group>
      <el-button :loading="planning" @click="handlePlan">
        <Icon icon="ep:magic-stick" class="mr-4px" />
        {{ candidates.length ? '再规划一版' : '开始规划' }}
      </el-button>
      <span class="text-12px text-[var(--el-text-color-secondary)]">
        规划结果只保存在当前窗口，关闭后丢失
      </span>
    </div>
    <el-empty
      v-if="!current.length"
      :description="planning ? '规划中，请稍候' : '尚未规划'"
      :image-size="80"
    />
    <template v-else>
      <!-- 检查点：按剧本原文场次核对覆盖情况 -->
      <div class="mb-12px flex flex-wrap gap-8px">
        <el-tag
          v-for="item in checkpoints"
          :key="item.sceneNumber"
          :type="item.duration > 0 ? 'success' : 'warning'"
        >
          场次 {{ item.sceneNumber }} · {{ item.count }} 镜 · {{ item.duration }} 秒
        </el-tag>
        <!-- DONE @AI：这种折行修复下；（文字单独一行） -->
        <el-tag type="info">
          合计 {{ totalDuration }} 秒；当前已有 {{ detail.storyboards.length }} 个镜头
        </el-tag>
      </div>
      <el-table :data="current" row-key="sceneNo" max-height="440px">
        <el-table-column label="#" type="index" width="50" align="center" />
        <el-table-column label="原文场次" width="80" align="center">
          <template #default="{ row }">{{ getSceneNumber(row) }}</template>
        </el-table-column>
        <el-table-column label="镜头序号" width="90">
          <template #default="{ row }">
            <el-input-number
              v-model="row.sceneNo"
              :min="1"
              size="small"
              controls-position="right"
              class="!w-70px"
            />
          </template>
        </el-table-column>
        <el-table-column label="标题" width="160">
          <template #default="{ row }">
            <el-input v-model="row.title" size="small" maxlength="255" />
          </template>
        </el-table-column>
        <el-table-column label="画面描述" min-width="260">
          <template #default="{ row }">
            <el-input v-model="row.sceneText" type="textarea" :rows="2" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="台词" min-width="160">
          <template #default="{ row }">
            <div v-for="(dialogue, index) in row.dialogues || []" :key="index" class="text-12px">
              {{ getCharacterName(dialogue.characterId) }}：{{ dialogue.line }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时长（秒）" width="110">
          <template #default="{ row }">
            <el-input-number
              v-model="row.duration"
              :min="1"
              :max="60"
              size="small"
              controls-position="right"
              class="!w-90px"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" @click="current.splice($index, 1)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button
        type="primary"
        :loading="importing"
        :disabled="!current.length || planning"
        @click="handleImport"
      >
        导入此方案
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaScriptApi } from '@/api/ai/drama/script'
import { DramaStoryboardVO } from '@/api/ai/drama/storyboard'

/** AI 短剧：规划分镜并审阅 */
defineOptions({ name: 'AiDramaPlanReviewDialog' })

const props = defineProps<{ detail: DramaProjectDetailVO; chatModelId?: number }>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const planning = ref(false)
const importing = ref(false)
const candidates = ref<DramaStoryboardVO[][]>([])
const candidateIndex = ref(0)
const scriptId = ref<number>()

const current = computed(() => candidates.value[candidateIndex.value] || [])
const totalDuration = computed(() =>
  current.value.reduce((sum, item) => sum + (item.duration || 0), 0)
)
/** 原文场次：分镜规划返回的场次；没有时按镜头序号 */
const getSceneNumber = (item: DramaStoryboardVO): number =>
  item.continuity?.sceneNumber ?? item.sceneNo ?? 0

/** 检查点：每个原文场次的镜头数、时长 */
const checkpoints = computed(() => {
  const map = new Map<number, { sceneNumber: number; count: number; duration: number }>()
  current.value.forEach((item) => {
    const sceneNumber = getSceneNumber(item)
    const checkpoint = map.get(sceneNumber) || { sceneNumber, count: 0, duration: 0 }
    checkpoint.count++
    checkpoint.duration += item.duration || 0
    map.set(sceneNumber, checkpoint)
  })
  return [...map.values()].sort((a, b) => a.sceneNumber - b.sceneNumber)
})

const getCharacterName = (characterId?: number) =>
  props.detail.characters.find((item) => item.id === characterId)?.name || '旁白'

const open = () => {
  candidates.value = []
  candidateIndex.value = 0
  scriptId.value = props.detail.script?.id
  dialogVisible.value = true
}
defineExpose({ open })

const handlePlan = async () => {
  planning.value = true
  try {
    const list = await DramaScriptApi.planStoryboardList(props.detail.project.id, props.chatModelId)
    candidates.value.push(list)
    candidateIndex.value = candidates.value.length - 1
  } finally {
    planning.value = false
  }
}

const handleImport = async () => {
  try {
    await message.confirm(
      `导入后替换当前剧本的全部 ${props.detail.storyboards.length} 个镜头（包括已生成的关键帧、视频），是否继续？`
    )
  } catch {
    return
  }
  importing.value = true
  try {
    await DramaScriptApi.importStoryboardList({
      projectId: props.detail.project.id,
      scriptId: scriptId.value!,
      storyboards: current.value
    })
    message.success('已导入分镜')
    dialogVisible.value = false
    emit('success')
  } finally {
    importing.value = false
  }
}
</script>
