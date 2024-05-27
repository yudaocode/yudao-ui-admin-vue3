
<template>
  <el-card body-class="" class="image-card" >
    <div class="image-operation">
      <div>
        <el-button type="" text bg >已完成</el-button>
      </div>
      <div>
        <el-button class="btn" text :icon="Download" @click="handlerBtnClick('download', imageDetail)" />
        <el-button class="btn" text :icon="Delete" @click="handlerBtnClick('delete', imageDetail)" />
        <el-button class="btn" text :icon="More" @click="handlerBtnClick('more', imageDetail)" />
      </div>
    </div>
    <div class="image-wrapper">
      <img class="image" :src="imageDetail?.imageUrl" />
    </div>
  </el-card>
</template>
<script setup lang="ts">
import {Delete, Download, More} from "@element-plus/icons-vue";
import {ImageDetailVO} from "@/api/ai/image";
import {PropType} from "vue";

const props = defineProps({
  imageDetail: {
    type: Object as PropType<ImageDetailVO>,
    require: true
  }
})

/**
 * 按钮 - 点击事件
 */
const handlerBtnClick = async (type, imageDetail: ImageDetailVO ) => {
  emits('onBtnClick', type, imageDetail)
}

// emits
const emits = defineEmits(['onBtnClick'])

</script>

<style scoped lang="scss">

.image-card {
  width: 320px;
  border-radius: 10px;

  .image-operation {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .btn {
      //border: 1px solid red;
      padding: 10px;
      margin: 0;
    }
  }

  .image-wrapper {
    overflow: hidden;
    margin-top: 20px;

    .image {
      width: 100%;
      border-radius: 10px;
    }
  }
}

</style>
