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
      <el-select
        :id="`input${index}`"
        :ref="setInputRef"
        v-show="inputVisible(index)"
        v-model="inputValue"
        filterable
        allow-create
        default-first-option
        :reserve-keyword="false"
        size="small"
        class="!w-30"
        @blur="handleInputConfirm(index, item.id)"
        @keyup.enter="handleInputConfirm(index, item.id)"
        @change="handleInputConfirm(index, item.id)"
      >
        <el-option
          v-for="item2 in attributeOptions"
          :key="item2.id"
          :label="item2.name"
          :value="item2.name"
        />
      </el-select>
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
const attributeOptions = ref([] as PropertyApi.PropertyValueVO[]) // 商品属性名称下拉框
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
const showInput = async (index: number) => {
  attributeIndex.value = index
  inputRef.value[index].focus()
  // 获取属性下拉选项
  await getAttributeOptions(attributeList.value[index].id)
}

/** 输入框失去焦点或点击回车时触发 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const handleInputConfirm = async (index: number, propertyId: number) => {
  if (inputValue.value) {
    // 1. 重复添加校验
    if (attributeList.value[index].values.find((item) => item.name === inputValue.value)) {
      message.warning('已存在相同属性值，请重试')
      attributeIndex.value = null
      inputValue.value = ''
      return
    }

    // 2.1 情况一：属性值已存在，则直接使用并结束
    const existValue = attributeOptions.value.find((item) => item.name === inputValue.value)
    if (existValue) {
      attributeIndex.value = null
      inputValue.value = ''
      attributeList.value[index].values.push({ id: existValue.id, name: existValue.name })
      emit('success', attributeList.value)
      return
    }

    // 2.2 情况二：新属性值，则进行保存
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

/** 获取商品属性下拉选项 */
const getAttributeOptions = async (propertyId: number) => {
  attributeOptions.value = await PropertyApi.getPropertyValueSimpleList(propertyId)
}
</script>
