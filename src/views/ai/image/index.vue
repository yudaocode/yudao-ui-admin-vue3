<!-- image -->
<template>
  <div class="ai-image">
    <div class="left">
      <div class="segmented">
        <el-segmented v-model="selectModel" :options="modelOptions" />
      </div>
      <div class="modal-switch-container">
        <Dall3 v-if="selectModel === 'DALL3绘画'" @on-draw-start="handlerDrawStart" @on-draw-complete="handlerDrawComplete" />
        <Midjourney v-if="selectModel === 'MJ绘画'" />
      </div>
    </div>
    <div class="main">
      <ImageTask ref="imageTaskRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Dall3 from './dall3/index.vue'
import Midjourney from './midjourney/index.vue'
import ImageTask from './ImageTask.vue'

// ref
const imageTaskRef = ref<any>() // image task ref

// 定义属性
const selectModel = ref('DALL3绘画')
const modelOptions = ['DALL3绘画', 'MJ绘画']
const drawIn = ref<boolean>(false)  // 生成中


/**
 * 绘画 - start
 */
const handlerDrawStart = async (type) => {
  // todo
  drawIn.value = true
}

/**
 * 绘画 - complete
 */
const handlerDrawComplete = async (type) => {
  drawIn.value = false
  // todo
  await imageTaskRef.value.getImageList()
}

//
onMounted( async () => {
})

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
    width: 350px;

    .segmented {
    }

    .segmented .el-segmented {
      --el-border-radius-base: 16px;
      --el-segmented-item-selected-color: #fff;
      background-color: #ececec;
      width: 350px;
    }

    .modal-switch-container {
      height: 100%;
      overflow-y: auto;
      margin-top: 30px;
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
