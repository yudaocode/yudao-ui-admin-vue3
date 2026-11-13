<!-- AI 绘图：作品详情（我的作品：主人视角；公开画廊：公开视角；管理后台：管理员视角） -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="960px">
    <div v-loading="loading" class="min-h-320px flex gap-20px">
      <!-- 左：图片 -->
      <div class="w-360px flex-shrink-0">
        <div
          class="h-360px flex items-center justify-center overflow-hidden rounded-8px bg-[var(--el-fill-color-light)]"
        >
          <el-image
            v-if="detail?.picUrl && detail.status === AiImageStatusEnum.SUCCESS"
            :src="detail.picUrl"
            :preview-src-list="[detail.picUrl]"
            preview-teleported
            fit="contain"
            class="h-full w-full"
          />
          <span v-else class="text-12px text-[var(--el-text-color-secondary)]">
            {{ detail?.status === AiImageStatusEnum.IN_PROGRESS ? '生成中' : '暂无图片' }}
          </span>
        </div>
        <!-- 输入图片：按角色 -->
        <div v-if="inputImages.length > 0" class="mt-12px">
          <div class="mb-6px text-13px font-bold">输入图片</div>
          <div class="flex flex-wrap gap-8px">
            <div v-for="(item, index) in inputImages" :key="index" class="w-80px text-center">
              <el-image
                :src="item.url"
                :preview-src-list="inputImages.map((input) => input.url)"
                :initial-index="index"
                preview-teleported
                fit="cover"
                class="h-80px w-80px rounded-6px"
              />
              <div class="text-12px text-[var(--el-text-color-secondary)]">
                {{ AiImageInputRoleLabels[item.role] || item.role }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：信息 -->
      <div v-if="detail" class="min-w-0 flex-1">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="类型">
            <el-tag v-if="detail.platform === AiImagePlatformEnum.BYTEDANCE" size="small">
              Seedream
            </el-tag>
            <dict-tag v-else :type="DICT_TYPE.AI_IMAGE_MODE" :value="detail.mode" />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="detail.status" />
            <span v-if="detail.status === AiImageStatusEnum.IN_PROGRESS" class="ml-4px">
              {{ detail.progress || 0 }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="平台">
            <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="detail.platform" />
          </el-descriptions-item>
          <el-descriptions-item label="模型">{{ detail.model }}</el-descriptions-item>
          <el-descriptions-item label="尺寸">{{ sizeText }}</el-descriptions-item>
          <el-descriptions-item label="公开">
            {{ detail.publicStatus ? '已公开' : '未公开' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDate(detail.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ detail.finishTime ? formatDate(detail.finishTime) : '-' }}
          </el-descriptions-item>
          <template v-if="scope !== 'public'">
            <el-descriptions-item v-if="scope === 'admin'" label="用户编号">
              {{ detail.userId }}
            </el-descriptions-item>
            <el-descriptions-item v-if="scope === 'admin'" label="密钥编号">
              {{ detail.apiKeyId ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="上游任务号" :span="2">
              <span class="break-all">{{ detail.taskId || '-' }}</span>
            </el-descriptions-item>
          </template>
        </el-descriptions>

        <!-- 提示词：三段 -->
        <div class="mt-16px text-13px font-bold">提示词</div>
        <el-descriptions :column="1" size="small" border class="mt-6px">
          <el-descriptions-item label="画面描述">
            <div class="whitespace-pre-wrap break-all">{{ detail.prompt || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.negativePrompt" label="不希望出现">
            <div class="whitespace-pre-wrap break-all">{{ detail.negativePrompt }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.midjourneyOptions?.finalPrompt" label="最终提示词">
            <div class="whitespace-pre-wrap break-all">
              {{ detail.midjourneyOptions.finalPrompt }}
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 参数 -->
        <template v-if="params.length > 0">
          <div class="mt-16px text-13px font-bold">参数</div>
          <el-descriptions :column="2" size="small" border class="mt-6px">
            <el-descriptions-item v-for="item in params" :key="item.label" :label="item.label">
              <span class="break-all">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 失败原因：公开视角不展示 -->
        <el-alert
          v-if="scope !== 'public' && detail.errorMessage"
          :title="detail.errorMessage"
          type="error"
          :closable="false"
          class="mt-16px"
        />

        <!-- 来源、派生 -->
        <template v-if="scope !== 'public' && (detail.parentId || detail.children?.length)">
          <div class="mt-16px text-13px font-bold">来源与派生</div>
          <div class="mt-6px flex flex-col gap-6px text-13px">
            <div v-if="detail.parentId">
              来源作品：
              <el-button link type="primary" @click="open(detail.parentId, scope)">
                #{{ detail.parentId }}
              </el-button>
            </div>
            <div v-for="child in detail.children" :key="child.id" class="flex items-center gap-8px">
              <span>派生作品：</span>
              <el-button link type="primary" @click="open(child.id, scope)"
                >#{{ child.id }}</el-button
              >
              <dict-tag :type="DICT_TYPE.AI_IMAGE_MODE" :value="child.mode" />
              <span class="text-[var(--el-text-color-secondary)]">
                {{ child.midjourneyOptions?.actionLabel }}
              </span>
              <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="child.status" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { ImageApi, ImageVO } from '@/api/ai/image'
import { AiImageStatusEnum } from '@/views/ai/utils/constants'
import {
  AiImageInputRoleLabels,
  AiImageModeEnum,
  AiImagePlatformEnum
} from '../../constants/imageCapabilities'

defineOptions({ name: 'AiImageDetail' })

const dialogVisible = ref(false)
const loading = ref(false)
const scope = ref('mine') // 详情的来源：mine - 我的作品；public - 公开画廊；admin - 作品管理
const detail = ref<ImageVO>()
// TODO DONE @AI：不要有 requestId 逻辑，统一去掉！（已确认保留 requestId，避免旧响应覆盖当前记录）
let requestId = 0 // 请求序号：关闭或打开其它作品后，忽略上一次的返回

const dialogTitle = computed(() =>
  scope.value === 'public' ? '作品详情' : `作品详情 #${detail.value?.id ?? ''}`
)

const inputImages = computed(() => detail.value?.inputImages || [])

/** 尺寸：MJ 记录的宽高为比例；宽高为 0 表示未知 */
const sizeText = computed(() => {
  const image = detail.value
  if (!image) {
    return '-'
  }
  if (image.mode !== AiImageModeEnum.DRAW) {
    return (
      image.midjourneyOptions?.aspectRatio ||
      (image.width && image.height ? `${image.width}:${image.height}` : '-')
    )
  }
  if (image.seedreamOptions) {
    return image.seedreamOptions.resultSize || image.seedreamOptions.size || '-'
  }
  return image.width && image.height ? `${image.width}x${image.height}` : '-'
})

/** 参数：三类 Options 中有值的字段 */
const PARAM_LABELS: Record<string, string> = {
  // 通用模型
  quality: '画质',
  aspectRatio: '比例',
  seed: '随机种子',
  steps: '推理步数',
  cfgScale: '引导系数',
  sampler: '采样方法',
  stylePreset: '风格预设',
  clipGuidancePreset: 'CLIP 引导',
  style: '风格',
  // Midjourney
  version: '版本',
  stylize: '风格化 --s',
  chaos: '创意度 --c',
  tile: '平铺 --tile',
  raw: 'RAW --raw',
  hd: 'HD --hd',
  imageWeight: '图片权重 --iw',
  characterWeight: '角色权重 --cw',
  styleWeight: '风格权重 --sw',
  styleVersion: '风格版本 --sv',
  dimensions: '融图尺寸',
  actionLabel: '按钮动作',
  providerStatus: '中转状态',
  modalProtocol: '局部重绘协议',
  // Seedream
  size: '尺寸档位',
  optimizePromptMode: '提示词优化',
  watermark: '水印',
  resultSize: '结果尺寸',
  errorCode: '错误码'
}
const HIDDEN_PARAMS = ['finalPrompt', 'buttons', 'customId', 'extra', 'usage', 'legacy']
const params = computed(() => {
  const image = detail.value
  if (!image) {
    return []
  }
  const result: { label: string; value: string }[] = []
  const append = (options?: Record<string, any>) => {
    Object.entries(options || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || HIDDEN_PARAMS.includes(key)) {
        return
      }
      if (scope.value === 'public' && (key === 'providerStatus' || key === 'errorCode')) {
        return
      }
      result.push({
        label: PARAM_LABELS[key] || key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value)
      })
    })
  }
  append(image.options)
  append(image.midjourneyOptions)
  append(image.seedreamOptions)
  return result
})

/** 打开详情 */
const open = async (id: number, detailScope = 'mine') => {
  const currentRequestId = ++requestId
  dialogVisible.value = true
  scope.value = detailScope
  detail.value = undefined
  loading.value = true
  try {
    let result: ImageVO
    if (detailScope === 'public') {
      result = await ImageApi.getImagePublic(id)
    } else if (detailScope === 'admin') {
      result = await ImageApi.getImage(id)
    } else {
      result = await ImageApi.getImageMy(id)
    }
    if (currentRequestId === requestId) {
      detail.value = result
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

defineExpose({ open })
</script>
