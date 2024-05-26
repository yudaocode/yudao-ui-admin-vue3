<template>
  <el-drawer
    v-model="showDrawer"
    title="图片详细"
    @close="handlerDrawerClose"
  >
    <div class="item">
      <div class="header">
        <div>图片</div>
        <div>
          <el-button class="btn" text :icon="Download" />
          <el-button class="btn" text :icon="Delete" />
          <el-button class="btn" text :icon="More" @click="handlerTaskDetail" />
        </div>
      </div>
      <div class="body">
        <ImageTaskCard :image-detail="imageDetail" />
      </div>
    </div>
    <div class="item">
      <div class="tip">提示词</div>
      <div class="body">
        {{imageDetail.prompt}}
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import {ImageApi, ImageDetailVO} from '@/api/ai/image';
import ImageTaskCard from './ImageTaskCard.vue';
import {Delete, Download, More} from "@element-plus/icons-vue";

const showDrawer = ref<boolean>(false) // 是否显示
const imageDetail = ref<ImageDetailVO>({} as ImageDetailVO) // 图片详细信息

const props = defineProps({
  show: {
    type: Boolean,
    require: true,
    default: false
  }
})

/**
 * 抽屉 - close
 */
const handlerDrawerClose = async () => {
  emits('handlerDrawerClose')
}

/**
 * 获取 - 图片 detail
 */
const getImageDetail = async (id) => {
  // 获取图片详细
  imageDetail.value = await ImageApi.getImageDetail(id)
}

/**
 * 任务 - detail
 */
const handlerTaskDetail = async () => {
  showDrawer.value = true
}

// watch
const { show } = toRefs(props)
watch(show, async (newValue, oldValue) => {
  showDrawer.value = newValue as boolean
})
//
const emits = defineEmits(['handlerDrawerClose'])

//
onMounted(async () => {
  await getImageDetail(1)
})
</script>
<style scoped lang="scss">

.item {
  margin-bottom: 20px;

  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-size: 16px;
    font-weight: bold;
  }

  .body {
    margin-top: 10px;
    color: #616161;
  }
}

.taskImage {
  border-radius: 10px;
}


</style>
