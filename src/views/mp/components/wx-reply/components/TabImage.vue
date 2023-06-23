<template>
  <div>
    <!-- 情况一：已经选择好素材、或者上传好图片 -->
    <div class="select-item" v-if="reply.url">
      <img class="material-img" :src="reply.url" />
      <p class="item-name" v-if="reply.name">{{ reply.name }}</p>
      <el-row class="ope-row" justify="center">
        <el-button type="danger" circle @click="onDelete">
          <Icon icon="ep:delete" />
        </el-button>
      </el-row>
    </div>
    <!-- 情况二：未做完上述操作 -->
    <el-row v-else style="text-align: center" align="middle">
      <!-- 选择素材 -->
      <el-col :span="12" class="col-select">
        <el-button type="success" @click="showDialog = true">
          素材库选择 <Icon icon="ep:circle-check" />
        </el-button>
        <el-dialog
          title="选择图片"
          v-model="showDialog"
          width="90%"
          append-to-body
          destroy-on-close
        >
          <WxMaterialSelect
            type="image"
            :account-id="reply.accountId"
            @select-material="selectMaterial"
          />
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
          :before-upload="beforeImageUpload"
          :on-success="onUploadSuccess"
        >
          <el-button type="primary">上传图片</el-button>
          <template #tip>
            <span>
              <div class="el-upload__tip">支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M</div>
            </span>
          </template>
        </el-upload>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import WxMaterialSelect from '@/views/mp/components/wx-material-select'
import { UploadType, useBeforeUpload } from '@/views/mp/hooks/useUpload'
import type { UploadRawFile } from 'element-plus'
import { getAccessToken } from '@/utils/auth'
import { Reply } from './types'
const message = useMessage()

const UPLOAD_URL = import.meta.env.VITE_API_BASEPATH + '/admin-api/mp/material/upload-temporary'
const HEADERS = { Authorization: 'Bearer ' + getAccessToken() } // 设置上传的请求头部

const props = defineProps<{
  modelValue: Reply
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply)
}>()
const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showDialog = ref(false)
const fileList = ref([])
const uploadData = reactive({
  accountId: reply.value.accountId,
  type: 'image',
  title: '',
  introduction: ''
})

const beforeImageUpload = (rawFile: UploadRawFile) => useBeforeUpload(UploadType.Image, 2)(rawFile)

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
  reply.value.mediaId = null
  reply.value.url = null
  reply.value.name = null
}

const selectMaterial = (item) => {
  showDialog.value = false

  // reply.value.type = 'image'
  reply.value.mediaId = item.mediaId
  reply.value.url = item.url
  reply.value.name = item.name
}
</script>

<style lang="scss" scoped>
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;

  .material-img {
    width: 100%;
  }

  .item-name {
    overflow: hidden;
    font-size: 12px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;

    .item-infos {
      width: 30%;
      margin: auto;
    }

    .ope-row {
      padding-top: 10px;
      text-align: center;
    }
  }

  .col-select {
    width: 49.5%;
    height: 160px;
    padding: 50px 0;
    border: 1px solid rgb(234 234 234);
  }

  .col-add {
    float: right;
    width: 49.5%;
    height: 160px;
    padding: 50px 0;
    border: 1px solid rgb(234 234 234);

    .el-upload__tip {
      line-height: 18px;
      text-align: center;
    }
  }
}
</style>
