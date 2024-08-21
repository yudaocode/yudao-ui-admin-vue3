<template>
  <el-form label-width="80px" :model="formData">
    <el-card header="按钮配置" class="property-group" shadow="never">
      <el-form-item label="展开方向" prop="direction">
        <el-radio-group v-model="formData.direction">
          <el-radio value="vertical">垂直</el-radio>
          <el-radio value="horizontal">水平</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="显示文字" prop="showText">
        <el-switch v-model="formData.showText" />
      </el-form-item>
    </el-card>
    <el-card header="按钮列表" class="property-group" shadow="never">
      <Draggable v-model="formData.list" :empty-item="{ textColor: '#fff' }">
        <template #default="{ element, index }">
          <el-form-item label="图标" :prop="`list[${index}].imgUrl`">
            <UploadImg v-model="element.imgUrl" height="56px" width="56px" />
          </el-form-item>
          <el-form-item label="文字" :prop="`list[${index}].text`">
            <InputWithColor v-model="element.text" v-model:color="element.textColor" />
          </el-form-item>
          <el-form-item label="跳转链接" :prop="`list[${index}].url`">
            <AppLinkInput v-model="element.url" />
          </el-form-item>
        </template>
      </Draggable>
    </el-card>
  </el-form>
</template>

<script setup lang="ts">
import { FloatingActionButtonProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 悬浮按钮属性面板
defineOptions({ name: 'FloatingActionButtonProperty' })

const props = defineProps<{ modelValue: FloatingActionButtonProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
