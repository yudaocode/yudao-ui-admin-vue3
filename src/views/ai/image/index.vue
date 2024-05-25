<!-- image -->
<template>
  <div class="ai-image">
    <div class="left">
      <div class="segmented">
        <el-segmented v-model="value" :options="options" />
      </div>
      <div class="modal-switch-container">
        <Dall3 />
      </div>
    </div>
    <div class="main">
      main
    </div>
    <div class="right">
      right
    </div>
  </div>
</template>
<script setup lang="ts">
import Dall3 from './dall3/index.vue'

const value = ref('DALL3绘画')
const options = ['DALL3绘画', 'MJ绘画']


</script>
<style scoped lang="scss">

.ai-image {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;

  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;


  .left {
    display: flex;
    flex-direction: column;
    padding: 20px;

    .segmented .el-segmented {
      --el-border-radius-base: 16px;
      --el-segmented-item-selected-color: #fff;
      background-color: #ececec;
      width: 350px;
    }

    .modal-switch-container {
      height: 100%;
      overflow-y: auto;
      margin-top: 15px;
    }
  }

  .main {
    flex: 1;
    background-color: #fff;
  }

  .right {
    width: 350px;
    background-color: #f7f8fa;
  }
}


</style>
