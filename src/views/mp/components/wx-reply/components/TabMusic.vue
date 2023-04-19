<template>
  <el-tab-pane name="music">
    <template #label>
      <el-row align="middle"><Icon icon="ep:service" />音乐</el-row>
    </template>
    <el-row align="middle" justify="center">
      <el-col :span="6">
        <el-row align="middle" justify="center" class="thumb-div">
          <el-col :span="24">
            <el-row align="middle" justify="center">
              <img style="width: 100px" v-if="objData.thumbMediaUrl" :src="objData.thumbMediaUrl" />
              <icon v-else icon="ep:plus" />
            </el-row>
            <el-row align="middle" justify="center" style="margin-top: 2%">
              <div class="thumb-but">
                <el-upload
                  :action="UPLOAD_URL"
                  :headers="HEADERS"
                  multiple
                  :limit="1"
                  :file-list="fileList"
                  :data="uploadData"
                  :before-upload="beforeImageUpload"
                  :on-success="onUploadSuccess"
                >
                  <template #trigger>
                    <el-button type="primary" link>本地上传</el-button>
                  </template>
                  <el-button type="primary" link @click="showDialog = true" style="margin-left: 5px"
                    >素材库选择
                  </el-button>
                </el-upload>
              </div>
            </el-row>
          </el-col>
        </el-row>
        <el-dialog
          title="选择图片"
          v-model="showDialog"
          width="80%"
          append-to-body
          destroy-on-close
        >
          <WxMaterialSelect
            :objData="{ type: 'image', accountId: objData.accountId }"
            @select-material="selectMaterial"
          />
        </el-dialog>
      </el-col>
      <el-col :span="18">
        <el-input v-model="objData.title" placeholder="请输入标题" />
        <div style="margin: 20px 0"></div>
        <el-input v-model="objData.description" placeholder="请输入描述" />
      </el-col>
    </el-row>
    <div style="margin: 20px 0"></div>
    <el-input v-model="objData.musicUrl" placeholder="请输入音乐链接" />
    <div style="margin: 20px 0"></div>
    <el-input v-model="objData.hqMusicUrl" placeholder="请输入高质量音乐链接" />
  </el-tab-pane>
</template>

<script setup lang="ts">
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import type { UploadRawFile } from 'element-plus'
import { MaterialType, useBeforeUpload } from '@/views/mp/hooks/useUpload'
import { getAccessToken } from '@/utils/auth'
import { ObjData } from './types'

const message = useMessage()

const UPLOAD_URL = import.meta.env.VITE_API_BASEPATH + '/admin-api/mp/material/upload-temporary'
const HEADERS = { Authorization: 'Bearer ' + getAccessToken() } // 设置上传的请求头部

const props = defineProps<{
  modelValue: ObjData
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: ObjData)
}>()
const objData = computed<ObjData>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showDialog = ref(false)
const fileList = ref([])
const uploadData = reactive({
  accountId: objData.value.accountId,
  type: 'thumb', // 音乐类型为thumb
  title: '',
  introduction: ''
})

const beforeImageUpload = (rawFile: UploadRawFile) =>
  useBeforeUpload(MaterialType.Image, 2)(rawFile)

const onUploadSuccess = (res: any) => {
  if (res.code !== 0) {
    message.error('上传出错：' + res.msg)
    return false
  }

  // 清空上传时的各种数据
  fileList.value = []
  uploadData.title = ''
  uploadData.introduction = ''

  // 上传好的文件，本质是个素材，所以可以进行选中
  selectMaterial(res.data)
}

const selectMaterial = (item: any) => {
  showDialog.value = false

  objData.value.thumbMediaId = item.mediaId
  objData.value.thumbMediaUrl = item.url
}
</script>
