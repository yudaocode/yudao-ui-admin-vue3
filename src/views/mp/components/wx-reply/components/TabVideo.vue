<template>
  <el-tab-pane name="video">
    <template #label>
      <el-row align="middle"><Icon icon="ep:share" /> 视频</el-row>
    </template>
    <el-row>
      <el-input v-model="objData.title" class="input-margin-bottom" placeholder="请输入标题" />
      <el-input
        class="input-margin-bottom"
        v-model="objData.description"
        placeholder="请输入描述"
      />
      <el-row class="ope-row" justify="center">
        <WxVideoPlayer v-if="objData.url" :url="objData.url" />
      </el-row>
      <el-col>
        <el-row style="text-align: center" align="middle">
          <!-- 选择素材 -->
          <el-col :span="12">
            <el-button type="success" @click="showDialog = true">
              素材库选择 <Icon icon="ep:circle-check" />
            </el-button>
            <el-dialog
              title="选择视频"
              v-model="showDialog"
              width="90%"
              append-to-body
              destroy-on-close
            >
              <WxMaterialSelect :objData="objData" @select-material="selectMaterial" />
            </el-dialog>
          </el-col>
          <!-- 文件上传 -->
          <el-col :span="12">
            <el-upload
              :action="UPLOAD_URL"
              :headers="HEADERS"
              multiple
              :limit="1"
              :file-list="fileList"
              :data="uploadData"
              :before-upload="beforeVideoUpload"
              :on-success="onUploadSuccess"
            >
              <el-button type="primary">新建视频 <Icon icon="ep:upload" /></el-button>
            </el-upload>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </el-tab-pane>
</template>

<script setup lang="ts">
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import type { UploadRawFile } from 'element-plus'
import { MaterialType, useBeforeUpload } from '@/views/mp/hooks/useUpload'
import { getAccessToken } from '@/utils/auth'
import { ObjData } from './types'

const message = useMessage()

const UPLOAD_URL = import.meta.env.VITE_API_BASEPATH + '/admin-api/mp/material/upload-temporary'
const HEADERS = { Authorization: 'Bearer ' + getAccessToken() }

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
  type: 'video',
  title: '',
  introduction: ''
})

const beforeVideoUpload = (rawFile: UploadRawFile) =>
  useBeforeUpload(MaterialType.Video, 10)(rawFile)

const onUploadSuccess = (res: any) => {
  if (res.code !== 0) {
    message.error('上传出错：' + res.msg)
    return false
  }

  // 清空上传时的各种数据
  fileList.value = []
  uploadData.title = ''
  uploadData.introduction = ''

  selectMaterial(res.data)
}

/** 选择素材后设置 */
const selectMaterial = (item: any) => {
  showDialog.value = false

  objData.value.mediaId = item.mediaId
  objData.value.url = item.url
  objData.value.name = item.name

  // title、introduction：从 item 到 tempObjItem，因为素材里有 title、introduction
  if (item.title) {
    objData.value.title = item.title || ''
  }
  if (item.introduction) {
    objData.value.description = item.introduction || ''
  }
}
</script>

<style lang="scss" scoped>
.input-margin-bottom {
  margin-bottom: 2%;
}

.ope-row {
  width: 100%;
  padding-top: 10px;
  text-align: center;
}
</style>
