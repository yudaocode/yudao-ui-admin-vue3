<template>
  <el-col v-for="(item, index) in attributeList" :key="index">
    <div>
      <el-text class="mx-1">属性名：</el-text>
      <el-text class="mx-1">{{ item.name }}</el-text>
    </div>
    <div>
      <el-text class="mx-1">属性值：</el-text>
      <el-tag
        v-for="(value, valueIndex) in item.attributeValues"
        :key="value.name"
        :disable-transitions="false"
        class="mx-1"
        closable
        @close="handleClose(index, valueIndex)"
      >
        {{ value.name }}
      </el-tag>
      <el-input
        v-if="inputVisible"
        ref="InputRef"
        v-model="inputValue"
        class="!w-20"
        size="small"
        @blur="handleInputConfirm(index)"
        @keyup.enter="handleInputConfirm(index)"
      />
      <el-button v-else class="button-new-tag ml-1" size="small" @click="showInput(index)">
        + 添加
      </el-button>
    </div>
    <el-divider class="my-10px" />
  </el-col>
</template>

<script lang="ts" name="ProductAttributes" setup>
import { ElInput } from 'element-plus'

const inputValue = ref('') // 输入框值
const inputVisible = ref(false) // 输入框显隐控制
const InputRef = ref<InstanceType<typeof ElInput>>() //标签输入框Ref
const attributeList = ref([])
const props = defineProps({
  attributeData: {
    type: Object,
    default: () => {}
  }
})

watch(
  () => props.attributeData,
  (data) => {
    if (!data) return
    attributeList.value = data
  },
  {
    deep: true,
    immediate: true
  }
)
/** 删除标签 tagValue 标签值*/
const handleClose = (index, valueIndex) => {
  const av = attributeList.value[index].attributeValues
  av.splice(valueIndex, 1)
}
/** 显示输入框并获取焦点 */
const showInput = (index) => {
  inputVisible.value = true
  nextTick(() => {
    InputRef.value[index]!.input!.focus()
  })
}
/** 输入框失去焦点或点击回车时触发 */
const handleInputConfirm = (index) => {
  if (inputValue.value) {
    // 因为ref再循环里，所以需要index获取对应的ref
    attributeList.value[index].attributeValues.push({ name: inputValue.value })
  }
  inputVisible.value = false
  inputValue.value = ''
}
</script>
