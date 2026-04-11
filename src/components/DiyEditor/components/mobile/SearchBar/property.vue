<template>
  <ComponentContainerProperty v-model="formData.style">
    <!-- 表单 -->
    <el-form label-width="80px" :model="formData" class="m-t-8px">
      <el-card header="搜索热词" class="property-group" shadow="never">
        <Draggable v-model="formData.hotKeywords" :empty-item="''" :min="0">
          <template #default="{ index }">
            <el-input v-model="formData.hotKeywords[index]" placeholder="请输入热词" />
          </template>
        </Draggable>
      </el-card>
      <el-card header="搜索样式" class="property-group" shadow="never">
        <el-form-item label="框体样式">
          <el-radio-group v-model="formData!.borderRadius">
            <el-tooltip content="方形" placement="top">
              <el-radio-button :value="0">
                <Icon icon="tabler:input-search" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip content="圆形" placement="top">
              <el-radio-button :value="10">
                <Icon icon="iconoir:input-search" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提示文字" prop="placeholder">
          <el-input v-model="formData.placeholder" />
        </el-form-item>
        <el-form-item label="文本位置" prop="placeholderPosition">
          <el-radio-group v-model="formData!.placeholderPosition">
            <el-tooltip content="居左" placement="top">
              <el-radio-button value="left">
                <Icon icon="ant-design:align-left-outlined" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip content="居中" placement="top">
              <el-radio-button value="center">
                <Icon icon="ant-design:align-center-outlined" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="扫一扫" prop="showScan">
          <el-switch v-model="formData!.showScan" />
        </el-form-item>
        <el-form-item label="框体高度" prop="height">
          <el-slider v-model="formData!.height" :max="50" :min="28" show-input input-size="small" />
        </el-form-item>
        <el-form-item label="框体颜色" prop="backgroundColor">
          <ColorInput v-model="formData.backgroundColor" />
        </el-form-item>
        <el-form-item class="lef" label="文本颜色" prop="textColor">
          <ColorInput v-model="formData.textColor" />
        </el-form-item>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { SearchProperty } from '@/components/DiyEditor/components/mobile/SearchBar/config'
import { isString } from '@/utils/is'

/** 搜索框属性面板 */
defineOptions({ name: 'SearchProperty' })

const props = defineProps<{ modelValue: SearchProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)

// 监听热词数组变化
watch(
  () => formData.value.hotKeywords,
  (newVal) => {
    // 找到非字符串项的索引
    const nonStringIndex = newVal.findIndex((item) => !isString(item))
    if (nonStringIndex !== -1) {
      formData.value.hotKeywords[nonStringIndex] = ''
    }
  },
  { deep: true, flush: 'post' }
)
</script>

<style scoped lang="scss"></style>
