<template>
  <el-form label-width="80px" :model="formData">
    <el-form-item label="高度" prop="height">
      <el-slider v-model="formData.height" :min="1" :max="100" show-input input-size="small" />
    </el-form-item>
    <el-form-item label="选择样式" prop="borderType">
      <el-radio-group v-model="formData!.borderType">
        <el-tooltip
          placement="top"
          v-for="(item, index) in BORDER_TYPES"
          :key="index"
          :content="item.text"
        >
          <el-radio-button :label="item.type">
            <Icon :icon="item.icon" />
          </el-radio-button>
        </el-tooltip>
      </el-radio-group>
    </el-form-item>
    <template v-if="formData.borderType !== 'none'">
      <el-form-item label="线宽" prop="lineWidth">
        <el-slider v-model="formData.lineWidth" :min="1" :max="30" show-input input-size="small" />
      </el-form-item>
      <el-form-item label="左右边距" prop="paddingType">
        <el-radio-group v-model="formData!.paddingType">
          <el-tooltip content="无边距" placement="top">
            <el-radio-button label="none">
              <Icon icon="tabler:box-padding" />
            </el-radio-button>
          </el-tooltip>
          <el-tooltip content="左右留边" placement="top">
            <el-radio-button label="horizontal">
              <Icon icon="vaadin:padding" />
            </el-radio-button>
          </el-tooltip>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="颜色">
        <!-- 分割线颜色 -->
        <ColorInput v-model="formData.lineColor" />
      </el-form-item>
    </template>
  </el-form>
</template>

<script setup lang="ts">
import { DividerProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
// 导航栏属性面板
defineOptions({ name: 'DividerProperty' })
const props = defineProps<{ modelValue: DividerProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

//线类型
const BORDER_TYPES = [
  {
    icon: 'vaadin:line-h',
    text: '实线',
    type: 'solid'
  },
  {
    icon: 'tabler:line-dashed',
    text: '虚线',
    type: 'dashed'
  },
  {
    icon: 'tabler:line-dotted',
    text: '点线',
    type: 'dotted'
  },
  {
    icon: 'entypo:progress-empty',
    text: '无',
    type: 'none'
  }
]
</script>

<style scoped lang="scss"></style>
