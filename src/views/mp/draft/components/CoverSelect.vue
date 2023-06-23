<template>
  <div>
    <p>封面:</p>
    <div class="thumb-div">
      <el-image
        v-if="newsItem.thumbUrl"
        style="width: 300px; max-height: 300px"
        :src="newsItem.thumbUrl"
        fit="contain"
      />
      <Icon
        v-else
        icon="ep:plus"
        class="avatar-uploader-icon"
        :class="isFirst ? 'avatar' : 'avatar1'"
      />
      <div class="thumb-but">
        <el-upload
          :action="UPLOAD_URL"
          :headers="HEADERS"
          multiple
          :limit="1"
          :file-list="fileList"
          :data="uploadData"
          :before-upload="onBeforeUpload"
          :on-error="onUploadError"
          :on-success="onUploadSuccess"
        >
          <template #trigger>
            <el-button size="small" type="primary">本地上传</el-button>
          </template>
          <el-button
            size="small"
            type="primary"
            @click="showImageDialog = true"
            style="margin-left: 5px"
          >
            素材库选择
          </el-button>
          <template #tip>
            <div class="el-upload__tip">支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M</div>
          </template>
        </el-upload>
      </div>
      <el-dialog
        title="选择图片"
        v-model="showImageDialog"
        width="80%"
        append-to-body
        destroy-on-close
      >
        <WxMaterialSelect
          type="image"
          :account-id="accountId!"
          @select-material="onMaterialSelected"
        />
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import WxMaterialSelect from '@/views/mp/components/wx-material-select'
import { getAccessToken } from '@/utils/auth'
import type { UploadFiles, UploadProps, UploadRawFile } from 'element-plus'
import { UploadType, useBeforeUpload } from '@/views/mp/hooks/useUpload'
import { NewsItem } from './types'
const message = useMessage()

const UPLOAD_URL = import.meta.env.VITE_BASE_URL + '/admin-api/mp/material/upload-permanent' // 上传永久素材的地址
const HEADERS = { Authorization: 'Bearer ' + getAccessToken() } // 设置上传的请求头部

const props = defineProps<{
  modelValue: NewsItem
  isFirst: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: NewsItem)
}>()
const newsItem = computed<NewsItem>({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

const accountId = inject<number>('accountId')
const showImageDialog = ref(false)

const fileList = ref<UploadFiles>([])
interface UploadData {
  type: UploadType
  accountId: number
}
const uploadData: UploadData = reactive({
  type: UploadType.Image,
  accountId: accountId!
})

/** 素材选择完成事件*/
const onMaterialSelected = (item: any) => {
  showImageDialog.value = false
  newsItem.value.thumbMediaId = item.mediaId
  newsItem.value.thumbUrl = item.url
}

const onBeforeUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) =>
  useBeforeUpload(UploadType.Image, 2)(rawFile)

const onUploadSuccess: UploadProps['onSuccess'] = (res: any) => {
  if (res.code !== 0) {
    message.error('上传出错：' + res.msg)
    return false
  }

  // 重置上传文件的表单
  fileList.value = []

  // 设置草稿的封面字段
  newsItem.value.thumbMediaId = res.data.mediaId
  newsItem.value.thumbUrl = res.data.url
}

const onUploadError = (err: Error) => {
  message.error('上传失败: ' + err.message)
}
</script>

<style lang="scss" scoped>
.el-upload__tip {
  margin-left: 5px;
}

.thumb-div {
  display: inline-block;
  width: 100%;
  text-align: center;

  .avatar-uploader-icon {
    width: 120px;
    height: 120px;
    font-size: 28px;
    line-height: 120px;
    color: #8c939d;
    text-align: center;
    border: 1px solid #d9d9d9;
  }

  .avatar {
    width: 230px;
    height: 120px;
  }

  .avatar1 {
    width: 120px;
    height: 120px;
  }

  .thumb-but {
    margin: 5px;
  }
}
</style>
