<template>
  <el-col v-for="(item, index) in attributeList" :key="index">
    <div>
      <el-text class="mx-1">属性名：</el-text>
      <el-text class="mx-1">{{ item.name }}</el-text>
    </div>
    <div>
      <el-text class="mx-1">属性值：</el-text>
      <el-tag
        v-for="(value, valueIndex) in item.values"
        :key="value.id"
        :disable-transitions="false"
        class="mx-1"
        closable
        @close="handleClose(index, valueIndex)"
      >
        {{ value.name }}
      </el-tag>
      <el-input
        v-show="inputVisible(index)"
        ref="InputRef"
        v-model="inputValue"
        class="!w-20"
        size="small"
        @blur="handleInputConfirm(index, item.id)"
        @keyup.enter="handleInputConfirm(index, item.id)"
      />
      <el-button
        v-show="!inputVisible(index)"
        class="button-new-tag ml-1"
        size="small"
        @click="showInput(index)"
      >
        + 添加
      </el-button>
    </div>
    <el-divider class="my-10px" />
  </el-col>
</template>

<script lang="ts" name="ProductAttributes" setup>
import { ElInput } from 'element-plus'
import * as PropertyApi from '@/api/mall/product/property'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const inputValue = ref('') // 输入框值
const attributeIndex = ref<number | null>(null) // 获取焦点时记录当前属性项的index
// 输入框显隐控制
const inputVisible = computed(() => (index) => {
  if (attributeIndex.value === null) return false
  if (attributeIndex.value === index) return true
})
const InputRef = ref() //标签输入框Ref
const attributeList = ref([]) // 商品属性列表
const props = defineProps({
  attributeData: {
    type: Array,
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
  attributeList.value[index].values?.splice(valueIndex, 1)
}

/** 显示输入框并获取焦点 */
const showInput = async (index) => {
  attributeIndex.value = index
  // 因为组件在ref中所以需要用索引获取对应的Ref
  InputRef.value[index]!.input!.focus()
}

/** 输入框失去焦点或点击回车时触发 */
const handleInputConfirm = async (index, propertyId) => {
  if (inputValue.value) {
    // 保存属性值
    try {
      const id = await PropertyApi.createPropertyValue({ propertyId, name: inputValue.value })
      attributeList.value[index].values.push({ id, name: inputValue.value })
      message.success(t('common.createSuccess'))
    } catch {
      message.error('添加失败，请重试') // TODO 缺少国际化
    }
  }
  attributeIndex.value = null
  inputValue.value = ''
}
</script>
