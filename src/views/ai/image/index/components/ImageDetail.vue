<template>
  <el-drawer
    v-model="showDrawer"
    title="图片详细"
    @close="handleDrawerClose"
    custom-class="drawer-class"
  >
    <!-- 图片 -->
    <div class="item">
      <div class="body">
        <el-image
          class="image"
          :src="detail?.picUrl"
          :preview-src-list="[detail.picUrl]"
          preview-teleported
        />
      </div>
    </div>
    <!-- 时间 -->
    <div class="item">
      <div class="tip">时间</div>
      <div class="body">
        <div>提交时间：{{ formatTime(detail.createTime, 'yyyy-MM-dd HH:mm:ss') }}</div>
        <div>生成时间：{{ formatTime(detail.finishTime, 'yyyy-MM-dd HH:mm:ss') }}</div>
      </div>
    </div>
    <!-- 模型 -->
    <div class="item">
      <div class="tip">模型</div>
      <div class="body"> {{ detail.model }}({{ detail.height }}x{{ detail.width }}) </div>
    </div>
    <!-- 提示词 -->
    <div class="item">
      <div class="tip">提示词</div>
      <div class="body">
        {{ detail.prompt }}
      </div>
    </div>
    <!-- 地址 -->
    <div class="item">
      <div class="tip">图片地址</div>
      <div class="body">
        {{ detail.picUrl }}
      </div>
    </div>
    <!-- StableDiffusion 专属区域 -->
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.STABLE_DIFFUSION && detail?.options?.sampler"
    >
      <div class="tip">采样方法</div>
      <div class="body">
        {{
          StableDiffusionSamplers.find(
            (item: ImageModelVO) => item.key === detail?.options?.sampler
          )?.name
        }}
      </div>
    </div>
    <div
      class="item"
      v-if="
        detail.platform === AiPlatformEnum.STABLE_DIFFUSION && detail?.options?.clipGuidancePreset
      "
    >
      <div class="tip">CLIP</div>
      <div class="body">
        {{
          StableDiffusionClipGuidancePresets.find(
            (item: ImageModelVO) => item.key === detail?.options?.clipGuidancePreset
          )?.name
        }}
      </div>
    </div>
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.STABLE_DIFFUSION && detail?.options?.stylePreset"
    >
      <div class="tip">风格</div>
      <div class="body">
        {{
          StableDiffusionStylePresets.find(
            (item: ImageModelVO) => item.key === detail?.options?.stylePreset
          )?.name
        }}
      </div>
    </div>
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.STABLE_DIFFUSION && detail?.options?.steps"
    >
      <div class="tip">迭代步数</div>
      <div class="body">
        {{ detail?.options?.steps }}
      </div>
    </div>
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.STABLE_DIFFUSION && detail?.options?.scale"
    >
      <div class="tip">引导系数</div>
      <div class="body">
        {{ detail?.options?.scale }}
      </div>
    </div>
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.STABLE_DIFFUSION && detail?.options?.seed"
    >
      <div class="tip">随机因子</div>
      <div class="body">
        {{ detail?.options?.seed }}
      </div>
    </div>
    <!-- Dall3 专属区域 -->
    <div class="item" v-if="detail.platform === AiPlatformEnum.OPENAI && detail?.options?.style">
      <div class="tip">风格选择</div>
      <div class="body">
        {{ Dall3StyleList.find((item: ImageModelVO) => item.key === detail?.options?.style)?.name }}
      </div>
    </div>
    <!-- Midjourney 专属区域 -->
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.MIDJOURNEY && detail?.options?.version"
    >
      <div class="tip">模型版本</div>
      <div class="body">
        {{ detail?.options?.version }}
      </div>
    </div>
    <div
      class="item"
      v-if="detail.platform === AiPlatformEnum.MIDJOURNEY && detail?.options?.referImageUrl"
    >
      <div class="tip">参考图</div>
      <div class="body">
        <el-image :src="detail.options.referImageUrl" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import {
  AiPlatformEnum,
  Dall3StyleList,
  ImageModelVO,
  StableDiffusionClipGuidancePresets,
  StableDiffusionSamplers,
  StableDiffusionStylePresets
} from '@/views/ai/utils/constants'
import { formatTime } from '@/utils'

const showDrawer = ref<boolean>(false) // 是否显示
const detail = ref<ImageVO>({} as ImageVO) // 图片详细信息

const props = defineProps({
  show: {
    type: Boolean,
    require: true,
    default: false
  },
  id: {
    type: Number,
    required: true
  }
})

/** 关闭抽屉  */
const handleDrawerClose = async () => {
  emits('handleDrawerClose')
}

/** 监听 drawer 是否打开 */
const { show } = toRefs(props)
watch(show, async (newValue, oldValue) => {
  showDrawer.value = newValue as boolean
})

/**  获取图片详情  */
const getImageDetail = async (id: number) => {
  detail.value = await ImageApi.getImageMy(id)
}

/** 监听 id 变化，加载最新图片详情 */
const { id } = toRefs(props)
watch(id, async (newVal, oldVal) => {
  if (newVal) {
    await getImageDetail(newVal)
  }
})

const emits = defineEmits(['handleDrawerClose'])
</script>
<style scoped lang="scss">
.item {
  margin-bottom: 20px;
  width: 100%;
  overflow: hidden;
  word-wrap: break-word;

  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .tip {
    font-weight: bold;
    font-size: 16px;
  }

  .body {
    margin-top: 10px;
    color: #616161;

    .taskImage {
      border-radius: 10px;
    }
  }
}
</style>
