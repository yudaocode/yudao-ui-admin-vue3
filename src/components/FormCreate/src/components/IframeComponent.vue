<!-- 网页 iframe 组件 (Element Plus 版本 - Vue3) -->
<template>
  <div class="iframe-component">
    <!-- iframe 预览 -->
    <div v-if="showPreview" class="iframe-preview">
      <iframe
        :src="displayUrl"
        :width="width"
        :height="height"
        :frameborder="frameborder"
        :allowfullscreen="allowfullscreen"
        :loading="loading"
        :sandbox="sandbox || undefined"
        class="iframe-content"
      ></iframe>
    </div>

    <!-- 无 URL 或无效 URL 提示 -->
    <div v-else class="iframe-placeholder">
      <el-empty description="请在右侧属性面板配置 URL 地址" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { isUrl } from '@/utils/is'

defineOptions({ name: 'IframeComponent' })

interface Props {
  modelValue?: string
  url?: string
  height?: string
  width?: string
  frameborder?: string
  allowfullscreen?: boolean
  loading?: 'eager' | 'lazy'
  sandbox?: string
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  url: '',
  height: '500px',
  width: '100%',
  frameborder: '0',
  allowfullscreen: true,
  loading: 'lazy',
  sandbox: ''
})

const displayUrl = computed(() => props.url || props.modelValue || '') // 显示的 URL（优先使用 url prop，其次使用 modelValue）
const showPreview = computed(() => {
  return displayUrl.value && isUrl(displayUrl.value)
}) // 是否显示预览

</script>

<style scoped>
.iframe-component {
  width: 100%;
}

.iframe-preview {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.iframe-content {
  display: block;
  border: none;
}

.iframe-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #fafafa;
}
</style>
