<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="80px" :model="formData">
      <el-form-item label="上传图片" prop="imgUrl">
        <UploadImg
          v-model="formData.imgUrl"
          draggable="false"
          height="80px"
          width="100%"
          class="min-w-80px"
        >
          <template #tip> 建议宽度750 </template>
        </UploadImg>
      </el-form-item>
      <el-form-item label="链接" prop="url">
        <AppLinkInput v-model="formData.url" />
      </el-form-item>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { ImageBarProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 图片展示属性面板
defineOptions({ name: 'ImageBarProperty' })

const props = defineProps<{ modelValue: ImageBarProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
