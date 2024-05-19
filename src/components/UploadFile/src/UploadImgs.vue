<template>
  <div class="upload-box">
    <el-upload
      v-model:file-list="fileList"
      :accept="fileType.join(',')"
      :action="uploadUrl"
      :before-upload="beforeUpload"
      :class="['upload', drag ? 'no-border' : '']"
      :disabled="disabled"
      :drag="drag"
      :http-request="httpRequest"
      :limit="limit"
      :multiple="true"
      :on-error="uploadError"
      :on-exceed="handleExceed"
      :on-success="uploadSuccess"
      list-type="picture-card"
    >
      <div class="upload-empty">
        <slot name="empty">
          <Icon icon="ep:plus" />
          <!-- <span>请上传图片</span> -->
        </slot>
      </div>
      <template #file="{ file }">
        <img :src="file.url" class="upload-image" />
        <div class="upload-handle" @click.stop>
          <div class="handle-icon" @click="handlePictureCardPreview(file)">
            <Icon icon="ep:zoom-in" />
            <span>查看</span>
          </div>
          <div v-if="!disabled" class="handle-icon" @click="handleRemove(file)">
            <Icon icon="ep:delete" />
            <span>删除</span>
          </div>
        </div>
      </template>
    </el-upload>
    <div class="el-upload__tip">
      <slot name="tip"></slot>
    </div>
    <el-image-viewer
      v-if="imgViewVisible"
      :url-list="[viewImageUrl]"
      @close="imgViewVisible = false"
    />
  </div>
</template>
<script lang="ts" setup>
import type { UploadFile, UploadProps, UploadUserFile } from 'element-plus'
import { ElNotification } from 'element-plus'

import { propTypes } from '@/utils/propTypes'
import { useUpload } from '@/components/UploadFile/src/useUpload'

defineOptions({ name: 'UploadImgs' })

const message = useMessage() // 消息弹窗

type FileTypes =
  | 'image/apng'
  | 'image/bmp'
  | 'image/gif'
  | 'image/jpeg'
  | 'image/pjpeg'
  | 'image/png'
  | 'image/svg+xml'
  | 'image/tiff'
  | 'image/webp'
  | 'image/x-icon'

const props = defineProps({
  modelValue: propTypes.oneOfType<string | string[]>([String, Array<String>]).isRequired,
  drag: propTypes.bool.def(true), // 是否支持拖拽上传 ==> 非必传（默认为 true）
  disabled: propTypes.bool.def(false), // 是否禁用上传组件 ==> 非必传（默认为 false）
  limit: propTypes.number.def(5), // 最大图片上传数 ==> 非必传（默认为 5张）
  fileSize: propTypes.number.def(5), // 图片大小限制 ==> 非必传（默认为 5M）
  fileType: propTypes.array.def(['image/jpeg', 'image/png', 'image/gif']), // 图片类型限制 ==> 非必传（默认为 ["image/jpeg", "image/png", "image/gif"]）
  height: propTypes.string.def('150px'), // 组件高度 ==> 非必传（默认为 150px）
  width: propTypes.string.def('150px'), // 组件宽度 ==> 非必传（默认为 150px）
  borderradius: propTypes.string.def('8px') // 组件边框圆角 ==> 非必传（默认为 8px）
})

const { uploadUrl, httpRequest } = useUpload()

const fileList = ref<UploadUserFile[]>([])
const uploadNumber = ref<number>(0)
const uploadList = ref<UploadUserFile[]>([])
/**
 * @description 文件上传之前判断
 * @param rawFile 上传的文件
 * */
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const imgSize = rawFile.size / 1024 / 1024 < props.fileSize
  const imgType = props.fileType
  if (!imgType.includes(rawFile.type as FileTypes))
    ElNotification({
      title: '温馨提示',
      message: '上传图片不符合所需的格式！',
      type: 'warning'
    })
  if (!imgSize)
    ElNotification({
      title: '温馨提示',
      message: `上传图片大小不能超过 ${props.fileSize}M！`,
      type: 'warning'
    })
  uploadNumber.value++
  return imgType.includes(rawFile.type as FileTypes) && imgSize
}

// 图片上传成功
interface UploadEmits {
  (e: 'update:modelValue', value: string[]): void
}

const emit = defineEmits<UploadEmits>()
const uploadSuccess: UploadProps['onSuccess'] = (res: any): void => {
  message.success('上传成功')
  // 删除自身
  const index = fileList.value.findIndex((item) => item.response?.data === res.data)
  fileList.value.splice(index, 1)
  uploadList.value.push({ name: res.data, url: res.data })
  if (uploadList.value.length == uploadNumber.value) {
    fileList.value.push(...uploadList.value)
    uploadList.value = []
    uploadNumber.value = 0
    emitUpdateModelValue()
  }
}

// 监听模型绑定值变动
watch(
  () => props.modelValue,
  (val: string | string[]) => {
    if (!val) {
      fileList.value = [] // fix：处理掉缓存，表单重置后上传组件的内容并没有重置
      return
    }

    fileList.value = [] // 保障数据为空
    fileList.value.push(
      ...(val as string[]).map((url) => ({ name: url.substring(url.lastIndexOf('/') + 1), url }))
    )
  },
  { immediate: true, deep: true }
)
// 发送图片链接列表更新
const emitUpdateModelValue = () => {
  let result: string[] = fileList.value.map((file) => file.url!)
  emit('update:modelValue', result)
}
// 删除图片
const handleRemove = (uploadFile: UploadFile) => {
  fileList.value = fileList.value.filter(
    (item) => item.url !== uploadFile.url || item.name !== uploadFile.name
  )
  emit(
    'update:modelValue',
    fileList.value.map((file) => file.url!)
  )
}

// 图片上传错误提示
const uploadError = () => {
  ElNotification({
    title: '温馨提示',
    message: '图片上传失败，请您重新上传！',
    type: 'error'
  })
}

// 文件数超出提示
const handleExceed = () => {
  ElNotification({
    title: '温馨提示',
    message: `当前最多只能上传 ${props.limit} 张图片，请移除后上传！`,
    type: 'warning'
  })
}

// 图片预览
const viewImageUrl = ref('')
const imgViewVisible = ref(false)
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  viewImageUrl.value = uploadFile.url!
  imgViewVisible.value = true
}
</script>

<style lang="scss" scoped>
.is-error {
  .upload {
    :deep(.el-upload--picture-card),
    :deep(.el-upload-dragger) {
      border: 1px dashed var(--el-color-danger) !important;

      &:hover {
        border-color: var(--el-color-primary) !important;
      }
    }
  }
}

:deep(.disabled) {
  .el-upload--picture-card,
  .el-upload-dragger {
    cursor: not-allowed;
    background: var(--el-disabled-bg-color) !important;
    border: 1px dashed var(--el-border-color-darker);

    &:hover {
      border-color: var(--el-border-color-darker) !important;
    }
  }
}

.upload-box {
  .no-border {
    :deep(.el-upload--picture-card) {
      border: none !important;
    }
  }

  :deep(.upload) {
    .el-upload-dragger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 0;
      overflow: hidden;
      border: 1px dashed var(--el-border-color-darker);
      border-radius: v-bind(borderradius);

      &:hover {
        border: 1px dashed var(--el-color-primary);
      }
    }

    .el-upload-dragger.is-dragover {
      background-color: var(--el-color-primary-light-9);
      border: 2px dashed var(--el-color-primary) !important;
    }

    .el-upload-list__item,
    .el-upload--picture-card {
      width: v-bind(width);
      height: v-bind(height);
      background-color: transparent;
      border-radius: v-bind(borderradius);
    }

    .upload-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .upload-handle {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      width: 100%;
      height: 100%;
      cursor: pointer;
      background: rgb(0 0 0 / 60%);
      opacity: 0;
      box-sizing: border-box;
      transition: var(--el-transition-duration-fast);
      align-items: center;
      justify-content: center;

      .handle-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0 6%;
        color: aliceblue;

        .el-icon {
          margin-bottom: 15%;
          font-size: 140%;
        }

        span {
          font-size: 100%;
        }
      }
    }

    .el-upload-list__item {
      &:hover {
        .upload-handle {
          opacity: 1;
        }
      }
    }

    .upload-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 12px;
      line-height: 30px;
      color: var(--el-color-info);

      .el-icon {
        font-size: 28px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .el-upload__tip {
    line-height: 15px;
    text-align: center;
  }
}
</style>
