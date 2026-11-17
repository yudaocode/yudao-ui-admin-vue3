<!-- AI 短剧制作管理：项目详情（只读） -->
<template>
  <Dialog v-model="dialogVisible" title="短剧项目详情" width="960px">
    <div v-loading="loading">
      <template v-if="detail">
        <el-descriptions :column="3" border label-width="96px">
          <el-descriptions-item label="编号">{{ detail.project.id }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ detail.project.name }}</el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ detail.project.userNickname || detail.project.userId }}
          </el-descriptions-item>
          <el-descriptions-item label="画风">
            <dict-tag :type="DICT_TYPE.AI_DRAMA_STYLE" :value="detail.project.style!" />
          </el-descriptions-item>
          <el-descriptions-item label="画幅">{{
            detail.project.composeAspectRatio
          }}</el-descriptions-item>
          <el-descriptions-item label="项目状态">
            <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="detail.project.status" />
          </el-descriptions-item>
          <el-descriptions-item label="故事想法" :span="3">
            <span class="whitespace-pre-wrap break-all">{{ detail.project.idea || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="成片状态">
            <dict-tag
              v-if="detail.project.composeStatus"
              :type="DICT_TYPE.AI_DRAMA_STATUS"
              :value="detail.project.composeStatus"
            />
            <span v-else>未合成</span>
          </el-descriptions-item>
          <el-descriptions-item label="成片时长">{{
            formatDramaDuration(detail.project.composeDuration)
          }}</el-descriptions-item>
          <el-descriptions-item label="成片画幅 / 镜头">
            {{ detail.project.composeAspectRatio || '-' }} /
            {{
              detail.project.composeStoryboardCount
                ? `${detail.project.composeStoryboardCount} 个`
                : '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item label="是否公开">{{
            detail.project.publicStatus ? '是' : '否'
          }}</el-descriptions-item>
          <el-descriptions-item
            v-if="
              detail.project.composeStatus === AiDramaStatusEnum.FAIL &&
              detail.project.composeErrorMessage
            "
            label="合成失败原因"
            :span="3"
          >
            <span class="break-all text-[var(--el-color-danger)]">{{
              detail.project.composeErrorMessage
            }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <video
          v-if="
            detail.project.composeStatus === AiDramaStatusEnum.SUCCESS &&
            detail.project.composeFileUrl
          "
          :src="detail.project.composeFileUrl"
          controls
          preload="metadata"
          class="mt-12px max-h-360px w-full rounded-6px bg-black"
        ></video>

        <el-tabs class="mt-12px">
          <el-tab-pane label="剧本">
            <template v-if="detail.script">
              <div class="font-500">{{ detail.script.title || '-' }}</div>
              <div
                class="my-8px whitespace-pre-wrap text-12px text-[var(--el-text-color-secondary)]"
              >
                {{ detail.script.outline }}
              </div>
              <div class="max-h-360px overflow-auto whitespace-pre-wrap break-all">{{
                detail.script.content
              }}</div>
            </template>
            <el-empty v-else description="暂无剧本" />
          </el-tab-pane>
          <el-tab-pane :label="`角色（${detail.characters.length}）`">
            <div v-for="character in detail.characters" :key="character.id" class="mb-12px">
              <div class="font-500">{{ character.name }}</div>
              <div class="mb-6px text-12px text-[var(--el-text-color-secondary)]">{{
                character.description
              }}</div>
              <div class="flex flex-wrap gap-8px">
                <AssetImage
                  v-for="appearance in character.appearances"
                  :key="appearance.id"
                  :url="getSelectedImageUrl(appearance.imageUrls, appearance.selectedIndex)"
                  :status="appearance.status"
                  :error-message="appearance.errorMessage"
                  size="80px"
                />
              </div>
            </div>
            <el-empty v-if="!detail.characters.length" description="暂无角色" />
          </el-tab-pane>
          <el-tab-pane :label="`场景与道具（${detail.locations.length + propList.length}）`">
            <div class="flex flex-wrap gap-12px">
              <div
                v-for="location in detail.locations"
                :key="`l${location.id}`"
                class="w-100px text-center text-12px"
              >
                <AssetImage
                  :url="getSelectedImageUrl(location.imageUrls, location.selectedIndex)"
                  :status="location.status"
                  :error-message="location.errorMessage"
                  size="100px"
                />
                <div class="truncate">场景：{{ location.name }}</div>
              </div>
              <div
                v-for="asset in propList"
                :key="`v${asset.id}`"
                class="w-100px text-center text-12px"
              >
                <AssetImage
                  :url="asset.imageUrl"
                  :status="asset.status"
                  :error-message="asset.errorMessage"
                  size="100px"
                />
                <div class="truncate">道具：{{ asset.title }}</div>
              </div>
            </div>
            <el-empty
              v-if="!detail.locations.length && !propList.length"
              description="暂无场景与道具"
            />
          </el-tab-pane>
          <el-tab-pane :label="`镜头（${detail.storyboards.length}）`">
            <el-table :data="detail.storyboards" max-height="400" :show-overflow-tooltip="true">
              <el-table-column label="镜头" prop="sceneNo" width="60" align="center" />
              <el-table-column label="标题" prop="title" min-width="120" />
              <el-table-column label="时长" prop="duration" width="70" align="center" />
              <el-table-column label="画面描述" prop="sceneText" min-width="200" />
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <dict-tag
                    v-if="row.videoStatus"
                    :type="DICT_TYPE.AI_DRAMA_STATUS"
                    :value="row.videoStatus"
                  />
                  <span v-else>未生成</span>
                </template>
              </el-table-column>
              <el-table-column label="服务商任务" prop="taskId" min-width="140" />
              <el-table-column
                label="视频"
                width="80"
                align="center"
                :show-overflow-tooltip="false"
              >
                <template #default="{ row }">
                  <el-link v-if="row.videoUrl" type="primary" :href="row.videoUrl" target="_blank">
                    播放
                  </el-link>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="失败原因" min-width="160">
                <template #default="{ row }">
                  {{ row.videoStatus === AiDramaStatusEnum.FAIL ? row.errorMessage || '-' : '-' }}
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else-if="!loading" description="项目不存在" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { DramaProjectApi, DramaProjectDetailVO } from '@/api/ai/drama/project'
import { AiDramaStatusEnum } from '@/views/ai/utils/constants'
import { formatDramaDuration, getDramaProps, getSelectedImageUrl } from '@/views/ai/utils/drama'
import AssetImage from '../components/AssetImage.vue'

/** AI 短剧制作管理：项目详情 */
defineOptions({ name: 'AiDramaProjectDetail' })

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<DramaProjectDetailVO>()
/** 当前的道具：不含关键帧、历史版本 */
const propList = computed(() => getDramaProps(detail.value?.visualAssets))

const open = async (id: number) => {
  dialogVisible.value = true
  detail.value = undefined
  loading.value = true
  try {
    detail.value = await DramaProjectApi.getProjectDetail(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
</script>
