<template>
  <el-tab-pane name="voice">
    <template #label>
      <el-row align="middle"><Icon icon="ep:phone" /> 语音</el-row>
    </template>
    <div class="select-item2" v-if="objData.url">
      <p class="item-name">{{ objData.name }}</p>
      <el-row class="ope-row" justify="center">
        <WxVoicePlayer :url="objData.url" />
      </el-row>
      <el-row class="ope-row" justify="center">
        <el-button type="danger" circle @click="onDelete"><Icon icon="ep:delete" /></el-button>
      </el-row>
    </div>
    <el-row v-else style="text-align: center">
      <!-- 选择素材 -->
      <el-col :span="12" class="col-select">
        <el-button type="success" @click="showDialog = true">
          素材库选择<Icon icon="ep:circle-check" />
        </el-button>
        <el-dialog
          title="选择语音"
          v-model="showDialog"
          width="90%"
          append-to-body
          destroy-on-close
        >
          <WxMaterialSelect :objData="objData" @select-material="selectMaterial" />
        </el-dialog>
      </el-col>
      <!-- 文件上传 -->
      <el-col :span="12" class="col-add">
        <el-upload
          :action="UPLOAD_URL"
          :headers="HEADERS"
          multiple
          :limit="1"
          :file-list="fileList"
          :data="uploadData"
          :before-upload="beforeVoiceUpload"
          :on-success="onUploadSuccess"
        >
          <el-button type="primary">点击上传</el-button>
          <template #tip>
            <div class="el-upload__tip">
              格式支持 mp3/wma/wav/amr，文件大小不超过 2M，播放长度不超过 60s
            </div>
          </template>
        </el-upload>
      </el-col>
    </el-row>
  </el-tab-pane>
</template>
<script setup lang="ts">
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import { MaterialType, useBeforeUpload } from '@/views/mp/hooks/useUpload'
import type { UploadRawFile } from 'element-plus'
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
  type: 'voice',
  title: '',
  introduction: ''
})

const beforeVoiceUpload = (rawFile: UploadRawFile) =>
  useBeforeUpload(MaterialType.Voice, 10)(rawFile)

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

const onDelete = () => {
  objData.value.mediaId = null
  objData.value.url = null
  objData.value.name = null
}

const selectMaterial = (item: ObjData) => {
  showDialog.value = false

  objData.value.type = 'voice'
  objData.value.mediaId = item.mediaId
  objData.value.url = item.url
  objData.value.name = item.name
}
</script>

<style lang="scss" scoped>
.select-item2 {
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;

  .item-name {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;

    .ope-row {
      width: 100%;
      padding-top: 10px;
      text-align: center;
    }
  }

  .col-select {
    border: 1px solid rgb(234, 234, 234);
    padding: 50px 0px;
    height: 160px;
    width: 49.5%;
  }

  .col-add {
    border: 1px solid rgb(234, 234, 234);
    padding: 50px 0px;
    height: 160px;
    width: 49.5%;
    float: right;

    .el-upload__tip {
      line-height: 18px;
      text-align: center;
    }
  }
}
</style>
