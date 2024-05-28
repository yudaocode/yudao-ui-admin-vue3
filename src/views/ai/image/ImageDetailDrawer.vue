<template>
  <el-drawer
    v-model="showDrawer"
    title="图片详细"
    @close="handlerDrawerClose"
    custom-class="drawer-class"
  >
    <!--  图片  -->
    <div class="item">
<!--      <div class="header">-->
<!--        <div>图片</div>-->
<!--        <div>-->
<!--        </div>-->
<!--      </div>-->
      <div class="body">
        <ImageTaskCard :image-detail="imageDetail" />
      </div>
    </div>
    <!--  时间  -->
    <div class="item">
      <div class="tip">时间</div>
      <div class="body">
        <div>提交时间：{{imageDetail.createTime}}</div>
        <div>生成时间：{{imageDetail.updateTime}}</div>
      </div>
    </div>
    <!--  模型  -->
    <div class="item">
      <div class="tip">模型</div>
      <div class="body">
        {{imageDetail.model}}
      </div>
    </div>
    <!--  提示词  -->
    <div class="item">
      <div class="tip">提示词</div>
      <div class="body">
        {{imageDetail.prompt}}
      </div>
    </div>
    <!--  风格  -->
    <div class="item">
      <div class="tip">风格</div>
      <div class="body">
        {{imageDetail.style}}
      </div>
    </div>
    <!--  地址  -->
    <div class="item">
      <div class="tip">地址</div>
      <div class="body">
        {{imageDetail.picUrl}}
      </div>
    </div>
    <!--  生成地址  -->
    <div class="item">
      <div class="tip">生成地址</div>
      <div class="body">
        {{imageDetail.originalPicUrl}}
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
  },
  id: {
    type: Number,
    required: true
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

// watch show
const { show } = toRefs(props)
watch(show, async (newValue, oldValue) => {
  showDrawer.value = newValue as boolean
})
// watch id
const { id } = toRefs(props)
watch(id, async (newVal, oldVal) => {
  console.log('newVal', newVal)
  if (newVal) {
    await getImageDetail(newVal)
  }
})
//
const emits = defineEmits(['handlerDrawerClose'])
//
onMounted(async () => {

})
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
