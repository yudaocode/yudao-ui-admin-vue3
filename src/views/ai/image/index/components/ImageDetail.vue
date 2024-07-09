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
        <div>提交时间：{{ detail.createTime }}</div>
        <div>生成时间：{{ detail.finishTime }}</div>
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
    <!-- 风格 -->
    <div class="item" v-if="detail?.options?.style">
      <div class="tip">风格</div>
      <div class="body">
        <!-- TODO @fan：貌似需要把 imageStyleList 搞到 api/image/index.ts 枚举起来？ -->
        <!-- TODO @fan：这里的展示，可能需要按照平台做区分 -->
        {{ detail?.options?.style }}
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import ImageCard from './ImageCard.vue'

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
