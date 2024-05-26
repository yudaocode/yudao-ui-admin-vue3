
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
          <el-button class="btn" text :icon="More" />
        </div>
      </div>
      <div class="image-wrapper">
        <img class="image" src="https://img.bigpt8.com/uploads/thumbnail/20240509/b7802797e5f709f35a451a1591d4d495.png" />
      </div>
    </el-card>

  </el-card>
</template>
<script setup lang="ts">

import {Delete, Download, More} from "@element-plus/icons-vue";
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
