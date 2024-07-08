<!-- 商品发布 - 库存价格 - 属性列表 -->
<template>
  <el-col v-for="(item, index) in attributeList" :key="index">
    <div>
      <el-text class="mx-1">属性名：</el-text>
      <el-tag :closable="!isDetail" class="mx-1" type="success" @close="handleCloseProperty(index)">
        {{ item.name }}
      </el-tag>
    </div>
    <div>
      <el-text class="mx-1">属性值：</el-text>
      <el-tag
        v-for="(value, valueIndex) in item.values"
        :key="value.id"
        :closable="!isDetail"
        class="mx-1"
        @close="handleCloseValue(index, valueIndex)"
      >
        {{ value.name }}
      </el-tag>
      <el-input
        v-show="inputVisible(index)"
        :id="`input${index}`"
        :ref="setInputRef"
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

<script lang="ts" setup>
import { ElInput } from 'element-plus'
import * as PropertyApi from '@/api/mall/product/property'
import { PropertyAndValues } from '@/views/mall/product/spu/components'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'ProductAttributes' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const inputValue = ref('') // 输入框值
const attributeIndex = ref<number | null>(null) // 获取焦点时记录当前属性项的index
// 输入框显隐控制
const inputVisible = computed(() => (index: number) => {
  if (attributeIndex.value === null) return false
  if (attributeIndex.value === index) return true
})
const inputRef = ref<any[]>([]) //标签输入框Ref
/** 解决 ref 在 v-for 中的获取问题*/
const setInputRef = (el: any) => {
  if (el === null || typeof el === 'undefined') return
  // 如果不存在 id 相同的元素才添加
  if (!inputRef.value.some((item) => item.input?.attributes.id === el.input?.attributes.id)) {
    inputRef.value.push(el)
  }
}
const attributeList = ref<PropertyAndValues[]>([]) // 商品属性列表
const props = defineProps({
  propertyList: {
    type: Array,
    default: () => {}
  },
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})

watch(
  () => props.propertyList,
  (data) => {
    if (!data) return
    attributeList.value = data as any
  },
  {
    deep: true,
    immediate: true
  }
)

/** 删除属性值*/
const handleCloseValue = (index: number, valueIndex: number) => {
  attributeList.value[index].values?.splice(valueIndex, 1)
}

/** 删除属性*/
const handleCloseProperty = (index: number) => {
  attributeList.value?.splice(index, 1)
  emit('success', attributeList.value)
}

/** 显示输入框并获取焦点 */
const showInput = async (index) => {
  attributeIndex.value = index
  inputRef.value[index].focus()
}

/** 输入框失去焦点或点击回车时触发 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const handleInputConfirm = async (index: number, propertyId: number) => {
  if (inputValue.value) {
    // 保存属性值
    try {
      const id = await PropertyApi.createPropertyValue({ propertyId, name: inputValue.value })
      attributeList.value[index].values.push({ id, name: inputValue.value })
      message.success(t('common.createSuccess'))
      emit('success', attributeList.value)
    } catch {
      message.error('添加失败，请重试')
    }
  }
  attributeIndex.value = null
  inputValue.value = ''
}
</script>
