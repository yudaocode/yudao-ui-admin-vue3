
<template>
  <el-card class="dr-task" body-class="task-card" shadow="never">
    <template #header>绘画任务</template>

    <el-card body-class="" class="image-card" >
      <div class="image-operation">
        <div>
          <el-button type="" text bg >已完成</el-button>
        </div>
        <div>
          <el-button class="btn" text :icon="Download" />
          <el-button class="btn" text :icon="Delete" />
          <el-button class="btn" text :icon="More" @click="handlerTaskDetail" />
        </div>
      </div>
      <div class="image-wrapper">
        <img class="image" src="https://img.bigpt8.com/uploads/thumbnail/20240509/b7802797e5f709f35a451a1591d4d495.png" />
      </div>
    </el-card>
  </el-card>
  <!-- 图片 detail 抽屉 -->
  <ImageDetailDrawer
    :show="showTaskDetail"
    @handler-drawer-close="handlerDrawerClose"
  />
</template>
<script setup lang="ts">
import ImageDetailDrawer from './ImageDetailDrawer.vue'
import {Delete, Download, More} from "@element-plus/icons-vue";
import {bool} from "vue-types";

const showTaskDetail = ref<bool>(false) // 是否显示 task 详情

/**
 * 图片人物 - detail
 */
const handlerTaskDetail = async () => {
  showTaskDetail.value = !showTaskDetail.value
}

/**
 * 抽屉 - 关闭
 */
const handlerDrawerClose = async () => {
  showTaskDetail.value = false
}


</script>

<style scoped lang="scss">

.dr-task {
  width: 100%;
  height: 100%;

  .task-card {

  }
}

.image-card {
  width: 360px;
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
