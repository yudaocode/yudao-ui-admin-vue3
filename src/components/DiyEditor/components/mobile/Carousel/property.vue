<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="80px" :model="formData">
      <el-card header="样式设置" class="property-group" shadow="never">
        <el-form-item label="样式" prop="type">
          <el-radio-group v-model="formData.type">
            <el-tooltip class="item" content="默认" placement="bottom">
              <el-radio-button label="default">
                <Icon icon="system-uicons:carousel" />
              </el-radio-button>
            </el-tooltip>
            <el-tooltip class="item" content="卡片" placement="bottom">
              <el-radio-button label="card">
                <Icon icon="ic:round-view-carousel" />
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="指示器" prop="indicator">
          <el-radio-group v-model="formData.indicator">
            <el-radio label="dot">小圆点</el-radio>
            <el-radio label="number">数字</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否轮播" prop="autoplay">
          <el-switch v-model="formData.autoplay" />
        </el-form-item>
        <el-form-item label="播放间隔" prop="interval" v-if="formData.autoplay">
          <el-slider
            v-model="formData.interval"
            :max="10"
            :min="0.5"
            :step="0.5"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
          <el-text type="info">单位：秒</el-text>
        </el-form-item>
      </el-card>
      <el-card header="内容设置" class="property-group" shadow="never">
        <Draggable v-model="formData.items" :empty-item="{ type: 'img' }">
          <template #default="{ element }">
            <el-form-item label="类型" prop="type" class="m-b-8px!" label-width="40px">
              <el-radio-group v-model="element.type">
                <el-radio label="img">图片</el-radio>
                <el-radio label="video">视频</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              label="图片"
              class="m-b-8px!"
              label-width="40px"
              v-if="element.type === 'img'"
            >
              <UploadImg
                v-model="element.imgUrl"
                draggable="false"
                height="80px"
                width="100%"
                class="min-w-80px"
              />
            </el-form-item>
            <template v-else>
              <el-form-item label="封面" class="m-b-8px!" label-width="40px">
                <UploadImg
                  v-model="element.imgUrl"
                  draggable="false"
                  height="80px"
                  width="100%"
                  class="min-w-80px"
                />
              </el-form-item>
              <el-form-item label="视频" class="m-b-8px!" label-width="40px">
                <UploadFile
                  v-model="element.videoUrl"
                  :file-type="['mp4']"
                  :limit="1"
                  :file-size="100"
                  class="min-w-80px"
                />
              </el-form-item>
            </template>
            <el-form-item label="链接" class="m-b-8px!" label-width="40px">
              <AppLinkInput v-model="element.url" />
            </el-form-item>
          </template>
        </Draggable>
      </el-card>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { CarouselProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 轮播图属性面板
defineOptions({ name: 'CarouselProperty' })

const props = defineProps<{ modelValue: CarouselProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
</script>

<style scoped lang="scss"></style>
