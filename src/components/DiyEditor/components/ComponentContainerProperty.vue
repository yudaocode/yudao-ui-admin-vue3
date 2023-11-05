<template>
  <el-tabs stretch>
    <el-tab-pane label="内容">
      <slot></slot>
    </el-tab-pane>
    <el-tab-pane label="样式" lazy>
      <el-card header="组件样式" class="property-group">
        <el-form :model="formData" label-width="80px">
          <el-form-item label="组件背景" prop="bgType">
            <el-radio-group v-model="formData.bgType">
              <el-radio label="color">纯色</el-radio>
              <el-radio label="img">图片</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="选择颜色" prop="bgColor" v-if="formData.bgType === 'color'">
            <ColorInput v-model="formData.bgColor" />
          </el-form-item>
          <el-form-item label="上传图片" prop="bgImg" v-else>
            <UploadImg v-model="formData.bgImg" :limit="1">
              <template #tip>建议宽度 750px</template>
            </UploadImg>
          </el-form-item>
          <el-tree :data="treeData" :expand-on-click-node="false">
            <template #default="{ node, data }">
              <el-form-item
                :label="data.label"
                :prop="data.prop"
                :label-width="node.level === 1 ? '80px' : '62px'"
                class="w-full m-b-0!"
              >
                <el-slider
                  v-model="formData[data.prop]"
                  :max="100"
                  :min="0"
                  show-input
                  input-size="small"
                  :show-input-controls="false"
                  @input="handleSliderChange(data.prop)"
                />
              </el-form-item>
            </template>
          </el-tree>
          <slot name="style" :formData="formData"></slot>
        </el-form>
      </el-card>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ComponentStyle, usePropertyForm } from '@/components/DiyEditor/util'

/**
 * 组件容器属性
 * 用于包裹组件，为组件提供 背景、外边距、内边距、边框等样式
 */
defineOptions({ name: 'ComponentContainer' })

const props = defineProps<{ modelValue: ComponentStyle }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

const treeData = [
  {
    label: '外部边距',
    prop: 'margin',
    children: [
      {
        label: '上',
        prop: 'marginTop'
      },
      {
        label: '右',
        prop: 'marginRight'
      },
      {
        label: '下',
        prop: 'marginBottom'
      },
      {
        label: '左',
        prop: 'marginLeft'
      }
    ]
  },
  {
    label: '内部边距',
    prop: 'padding',
    children: [
      {
        label: '上',
        prop: 'paddingTop'
      },
      {
        label: '右',
        prop: 'paddingRight'
      },
      {
        label: '下',
        prop: 'paddingBottom'
      },
      {
        label: '左',
        prop: 'paddingLeft'
      }
    ]
  },
  {
    label: '边框圆角',
    prop: 'borderRadius',
    children: [
      {
        label: '上左',
        prop: 'borderTopLeftRadius'
      },
      {
        label: '上右',
        prop: 'borderTopRightRadius'
      },
      {
        label: '下右',
        prop: 'borderBottomRightRadius'
      },
      {
        label: '下左',
        prop: 'borderBottomLeftRadius'
      }
    ]
  }
]

const handleSliderChange = (prop: string) => {
  switch (prop) {
    case 'margin':
      formData.value.marginTop = formData.value.margin
      formData.value.marginRight = formData.value.margin
      formData.value.marginBottom = formData.value.margin
      formData.value.marginLeft = formData.value.margin
      break
    case 'padding':
      formData.value.paddingTop = formData.value.padding
      formData.value.paddingRight = formData.value.padding
      formData.value.paddingBottom = formData.value.padding
      formData.value.paddingLeft = formData.value.padding
      break
    case 'borderRadius':
      formData.value.borderTopLeftRadius = formData.value.borderRadius
      formData.value.borderTopRightRadius = formData.value.borderRadius
      formData.value.borderBottomRightRadius = formData.value.borderRadius
      formData.value.borderBottomLeftRadius = formData.value.borderRadius
      break
  }
}
</script>

<style scoped lang="scss">
:deep(.el-slider__runway) {
  margin-right: 16px;
}
:deep(.el-input-number) {
  width: 50px;
}
</style>
