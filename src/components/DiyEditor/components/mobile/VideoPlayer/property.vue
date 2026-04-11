<template>
  <ComponentContainerProperty v-model="formData.style">
    <template #style>
      <el-form-item label="高度" prop="height">
        <el-slider
          v-model="formData.style.height"
          :max="500"
          :min="100"
          show-input
          input-size="small"
          :show-input-controls="false"
        />
      </el-form-item>
    </template>
    <el-form label-width="80px" :model="formData">
      <el-form-item label="上传视频" prop="videoUrl">
        <UploadFile
          v-model="formData.videoUrl"
          :file-type="['mp4']"
          :limit="1"
          :file-size="100"
          class="min-w-80px"
        />
      </el-form-item>
      <el-form-item label="上传封面" prop="posterUrl">
        <UploadImg
          v-model="formData.posterUrl"
          draggable="false"
          height="80px"
          width="100%"
          class="min-w-80px"
        >
          <template #tip> 建议宽度750 </template>
        </UploadImg>
      </el-form-item>
      <el-form-item label="自动播放" prop="autoplay">
        <el-switch v-model="formData.autoplay" />
      </el-form-item>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { VideoPlayerProperty } from './config'
import { useVModel } from '@vueuse/core'

// 视频播放属性面板
defineOptions({ name: 'VideoPlayerProperty' })

const props = defineProps<{ modelValue: VideoPlayerProperty }>()
const emit = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emit)
</script>

<style scoped lang="scss"></style>
