<!-- AI 绘图：作品卡片（我的作品可操作；公开画廊只读） -->
<template>
  <div
    class="flex flex-col overflow-hidden border border-[var(--el-border-color-lighter)] rounded-8px border-solid hover:shadow-[var(--el-box-shadow-light)]"
  >
    <!-- 图片 -->
    <div class="relative h-200px bg-[var(--el-fill-color-light)]">
      <el-image
        v-if="image.picUrl && image.status === AiImageStatusEnum.SUCCESS"
        :key="imageKey"
        :src="image.picUrl"
        :preview-src-list="[image.picUrl]"
        preview-teleported
        fit="cover"
        loading="lazy"
        class="h-full w-full"
      >
        <template #error>
          <div
            class="h-full w-full flex cursor-pointer flex-col items-center justify-center gap-4px text-12px text-[var(--el-text-color-secondary)]"
            @click.stop="imageKey++"
          >
            <Icon icon="ep:picture" :size="20" />
            图片加载失败，点击重试
          </div>
        </template>
      </el-image>
      <div
        v-else-if="image.status === AiImageStatusEnum.IN_PROGRESS"
        class="h-full w-full flex flex-col items-center justify-center gap-8px px-24px text-12px text-[var(--el-text-color-secondary)]"
      >
        <Icon icon="ep:loading" class="is-loading text-[var(--el-color-primary)]" />
        生成中 {{ image.progress || 0 }}%
        <el-progress :percentage="image.progress || 0" :show-text="false" class="w-full" />
        <span v-if="image.midjourneyOptions?.providerStatus">
          {{ image.midjourneyOptions.providerStatus }}
        </span>
      </div>
      <div
        v-else
        class="h-full w-full flex flex-col items-center justify-center gap-6px overflow-hidden px-12px text-center text-12px text-[var(--el-color-danger)]"
      >
        <Icon icon="ep:circle-close" :size="20" />
        <span class="line-clamp-4 break-all">{{ image.errorMessage || '生成失败' }}</span>
      </div>
      <!-- 类型、公开标记：Seedream 与通用模型同为 AI 生图，按平台区分 -->
      <div class="absolute left-8px top-8px flex gap-4px">
        <el-tag v-if="image.platform === AiImagePlatformEnum.DOU_BAO" size="small">Seedream</el-tag>
        <dict-tag v-else :type="DICT_TYPE.AI_IMAGE_MODE" :value="image.mode" />
        <el-tag v-if="scope === 'mine' && image.publicStatus" type="success" size="small">
          已公开
        </el-tag>
      </div>
    </div>

    <!-- 信息 -->
    <div class="flex flex-1 flex-col gap-6px p-10px">
      <div class="line-clamp-2 min-h-36px break-all text-13px leading-18px" :title="image.prompt">
        {{ image.prompt || '（无提示词）' }}
      </div>
      <div
        class="flex items-center justify-between gap-8px text-12px text-[var(--el-text-color-secondary)]"
      >
        <span class="truncate" :title="image.model">{{ image.model }}</span>
        <span class="flex-shrink-0">{{ formatDate(image.createTime, 'MM-DD HH:mm') }}</span>
      </div>

      <!-- Midjourney：U / V 宫格（与四宫格位置对应），其它按钮收进下拉 -->
      <div v-if="scope === 'mine' && gridButtons.length > 0" class="flex gap-8px">
        <div
          v-for="group in gridButtonGroups"
          :key="group.label"
          class="flex flex-1 items-center gap-4px"
        >
          <span class="text-12px text-[var(--el-text-color-secondary)]">{{ group.label }}</span>
          <div class="grid grid-cols-2 flex-1 gap-2px">
            <el-button
              v-for="button in group.buttons"
              :key="button.customId"
              size="small"
              class="!ml-0 !h-20px !px-0"
              :loading="actingId === button.customId"
              @click="handleAction(button)"
            >
              {{ button.label }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作：常用的单行展示；公开、Midjourney 其它动作、删除收进「更多」 -->
      <div class="mt-auto flex items-center gap-12px whitespace-nowrap">
        <el-button link type="primary" size="small" @click="emit('detail', image)">详情</el-button>
        <el-button
          v-if="image.status === AiImageStatusEnum.SUCCESS"
          link
          type="primary"
          size="small"
          class="!ml-0"
          @click="handleDownload"
        >
          下载
        </el-button>
        <template v-if="scope === 'mine'">
          <el-button
            v-if="canRegenerate"
            link
            type="primary"
            size="small"
            class="!ml-0"
            @click="emit('regenerate', image)"
          >
            重新生成
          </el-button>
          <el-dropdown
            v-if="image.status !== AiImageStatusEnum.IN_PROGRESS || otherButtons.length > 0"
            trigger="click"
            @command="handleCommand"
          >
            <el-button link type="primary" size="small">
              更多 <Icon icon="ep:arrow-down" class="ml-2px" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="button in otherButtons"
                  :key="button.customId"
                  :command="button"
                >
                  {{ getButtonText(button) }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="image.status === AiImageStatusEnum.SUCCESS"
                  command="public"
                  :divided="otherButtons.length > 0"
                >
                  {{ image.publicStatus ? '取消公开' : '公开' }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="image.status !== AiImageStatusEnum.IN_PROGRESS"
                  command="delete"
                  divided
                >
                  <span class="text-[var(--el-color-danger)]">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import { ImageApi, ImageMidjourneyButtonsVO, ImageVO } from '@/api/ai/image'
import { AiImageStatusEnum } from '@/views/ai/utils/constants'
import {
  AiImageModeEnum,
  AiImagePlatformEnum,
  isMjGridButton,
  isMjHiddenButton,
  isMjInpaintButton
} from '../../constants/imageCapabilities'

defineOptions({ name: 'AiImageCard' })

const props = defineProps({
  image: {
    type: Object as PropType<ImageVO>,
    required: true
  },
  scope: {
    type: String as PropType<'mine' | 'public'>,
    default: 'mine'
  }
})
const emit = defineEmits(['detail', 'public', 'regenerate', 'delete', 'inpaint', 'acted'])

const message = useMessage() // 消息弹窗

const imageKey = ref(0) // 图片加载失败时，变更 key 重新加载

/** Midjourney 按钮：只在成功后展示；换脸结果没有 U / V；CustomZoom 本期隐藏 */
const buttons = computed<ImageMidjourneyButtonsVO[]>(() => {
  if (props.image.status !== AiImageStatusEnum.SUCCESS) {
    return []
  }
  return (props.image.midjourneyOptions?.buttons || []).filter(
    (button) => !isMjHiddenButton(button.customId)
  )
})
const gridButtons = computed(() =>
  props.image.mode === AiImageModeEnum.MIDJOURNEY_SWAP_FACE
    ? []
    : buttons.value.filter((button) => isMjGridButton(button.customId))
)
const gridButtonGroups = computed(() =>
  [
    {
      label: '放大',
      buttons: gridButtons.value.filter((b) => b.customId.includes('::upsample::'))
    },
    {
      label: '变化',
      buttons: gridButtons.value.filter((b) => b.customId.includes('::variation::'))
    }
  ].filter((group) => group.buttons.length > 0)
)
const otherButtons = computed(() =>
  buttons.value.filter((button) => !isMjGridButton(button.customId))
)

/** 重新生成：按钮动作、局部重绘是派生任务，不回填 */
const canRegenerate = computed(
  () =>
    props.image.mode !== AiImageModeEnum.MIDJOURNEY_ACTION &&
    props.image.mode !== AiImageModeEnum.MIDJOURNEY_MODAL &&
    props.image.status !== AiImageStatusEnum.IN_PROGRESS
)

const getButtonText = (button: ImageMidjourneyButtonsVO) =>
  [button.emoji, button.label].filter(Boolean).join(' ') || button.customId.split('::')[2]

/** 下载 */
const handleDownload = () => {
  download.image({ url: props.image.picUrl })
}

/** 「更多」下拉：公开、删除，或 Midjourney 按钮 */
const handleCommand = (command: 'public' | 'delete' | ImageMidjourneyButtonsVO) => {
  if (command === 'public' || command === 'delete') {
    emit(command, props.image)
    return
  }
  handleAction(command)
}

/** 执行 Midjourney 按钮：局部重绘打开蒙版弹窗，其它直接提交 */
const actingId = ref<string>()
const handleAction = async (button: ImageMidjourneyButtonsVO) => {
  if (isMjInpaintButton(button.customId)) {
    emit('inpaint', props.image)
    return
  }
  try {
    await message.confirm(`确认执行「${getButtonText(button)}」？将生成一条新的作品`)
  } catch {
    return
  }
  actingId.value = button.customId
  try {
    await ImageApi.midjourneyAction({ id: props.image.id, customId: button.customId })
    message.success('已提交')
    emit('acted')
  } finally {
    actingId.value = undefined
  }
}
</script>
