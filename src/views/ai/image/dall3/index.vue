<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开.</el-text>
    <el-input
      v-model="prompt"
      maxlength="1024"
      rows="5"
      style="width: 100%; margin-top: 15px;"
      input-style="border-radius: 7px;"
      placeholder="例如：童话里的小屋应该是什么样子？"
      show-word-limit
      type="textarea"
    />
  </div>
  <div class="hot-words">
    <div>
      <el-text tag="b">随机热词</el-text>
    </div>
    <el-space wrap class="word-list">
      <el-button round
                 class="btn"
                 :type="(selectHotWord === hotWord ? 'primary' : 'default')"
                 v-for="hotWord in hotWords"
                 :key="hotWord"
                 @click="handlerHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </el-button>
    </el-space>
  </div>
  <div class="model">
    <div>
      <el-text tag="b">模型</el-text>
    </div>
    <el-space wrap class="model-list">
      <div
        :class="selectModel === model ? 'modal-item selectModel' : 'modal-item'"
        v-for="model in models"
        :key="model.key"

      >
        <el-image
          :src="model.image"
          fit="contain"
          @click="handlerModelClick(model)"
        />
      </div>
    </el-space>
  </div>

</template>
<script setup lang="ts">

// image 模型
interface ImageModelVO {
  key: string
  name: string
  image: string
}

// 定义属性
const prompt = ref<string>('')  // 提示词
const selectHotWord = ref<string>('') // 选中的热词
const hotWords = ref<string[]>(['中国旗袍', '古装美女', '卡通头像', '机甲战士', '童话小屋', '中国长城'])  // 热词
const selectModel = ref<any>() // 选中的热词
const models = ref<[ImageModelVO]>([
  {
    key: 'qinxi',
    name: '清晰',
    image: 'https://h5.cxyhub.com/images/model_1.png',
  },
  {
    key: 'ziran',
    name: '清晰',
    image: 'https://h5.cxyhub.com/images/model_2.png',
  },
])  // 模型


// 定义 Props
const props = defineProps({})

/**
 * 热词 - click
 */
const handlerHotWordClick = async (hotWord: string) => {
  // 取消
  if (selectHotWord.value == hotWord) {
    selectHotWord.value = ''
    return
  }
  // 选中
  selectHotWord.value = hotWord
}

/**
 * 模型 - click
 */
const handlerModelClick = async (model: ImageModelVO) => {
  if (selectModel.value === model.key) {
    selectModel.value = ''
    return
  }
  selectModel.value = model
}


</script>
<style scoped lang="scss">

// 提示词
.prompt {
}

// 热词
.hot-words {
  display: flex;
  flex-direction: column;
  margin-top: 30px;

  .word-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: start;
    margin-top: 15px;

    .btn {
      margin: 0;
    }
  }
}

// 模型
.model {
  margin-top: 30px;

  .model-list {
    margin-top: 15px;

    .modal-item {
      width: 90px;
      height: 50px;
      //outline: 1px solid blue;
      overflow: hidden;
      display: flex;
      border: 3px solid transparent;
      cursor: pointer;
    }

    .selectModel {
      border: 3px solid #1293ff;
      border-radius: 5px;
    }
  }

  // 比例


}
</style>
