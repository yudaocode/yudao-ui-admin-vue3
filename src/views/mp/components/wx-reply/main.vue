<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除多余的 rep 为前缀的变量，让 message 消息更简单
  ② 代码优化，补充注释，提升阅读性
  ③ 优化消息的临时缓存策略，发送消息时，只清理被发送消息的 tab，不会强制切回到 text 输入
  ④ 支持发送【视频】消息时，支持新建视频
-->
<template>
  <el-tabs type="border-card" v-model="objData.type" @tab-click="handleClick">
    <!-- 类型 1：文本 -->
    <el-tab-pane name="text">
      <template #label>
        <el-row align="middle"><Icon icon="ep:document" /> 文本</el-row>
      </template>
      <el-input
        type="textarea"
        :rows="5"
        placeholder="请输入内容"
        v-model="objData.content"
        @input="inputContent"
      />
    </el-tab-pane>
    <!-- 类型 2：图片 -->
    <el-tab-pane name="image">
      <template #label>
        <el-row align="middle"><Icon icon="ep:picture" class="mr-5px" /> 图片</el-row>
      </template>
      <!-- 情况一：已经选择好素材、或者上传好图片 -->
      <div class="select-item" v-if="objData.url">
        <img class="material-img" :src="objData.url" />
        <p class="item-name" v-if="objData.name">{{ objData.name }}</p>
        <el-row class="ope-row" justify="center">
          <el-button type="danger" circle @click="deleteObj">
            <Icon icon="ep:delete" />
          </el-button>
        </el-row>
      </div>
      <!-- 情况二：未做完上述操作 -->
      <el-row v-else style="text-align: center" align="middle">
        <!-- 选择素材 -->
        <el-col :span="12" class="col-select">
          <el-button type="success" @click="openMaterial">
            素材库选择 <Icon icon="ep:circle-check" />
          </el-button>
          <el-dialog title="选择图片" v-model="dialogState.image" width="90%" append-to-body>
            <WxMaterialSelect :obj-data="objData" @select-material="selectMaterial" />
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
    </el-tab-pane>
    <!-- 类型 3：语音 -->
    <el-tab-pane name="voice">
      <template #label>
        <el-row align="middle"><Icon icon="ep:phone" /> 语音</el-row>
      </template>
      <div class="select-item2" v-if="objData.url">
        <p class="item-name">{{ objData.name }}</p>
        <div class="item-infos">
          <WxVoicePlayer :url="objData.url" />
        </div>
        <el-row class="ope-row" justify="center">
          <el-button type="danger" circle @click="deleteObj"><Icon icon="ep:delete" /></el-button>
        </el-row>
      </div>
      <el-row v-else style="text-align: center">
        <!-- 选择素材 -->
        <el-col :span="12" class="col-select">
          <el-button type="success" @click="openMaterial">
            素材库选择<Icon icon="ep:circle-check" />
          </el-button>
          <el-dialog title="选择语音" v-model="dialogState.voice" width="90%" append-to-body>
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
    <!-- 类型 4：视频 -->
    <el-tab-pane name="video">
      <template #label>
        <el-row align="middle"><Icon icon="ep:share" /> 视频</el-row>
      </template>
      <el-row>
        <el-input
          v-model="objData.title"
          class="input-margin-bottom"
          placeholder="请输入标题"
          @input="inputContent"
        />
        <el-input
          class="input-margin-bottom"
          v-model="objData.description"
          placeholder="请输入描述"
          @input="inputContent"
        />
        <el-row style="text-align: center" justify="center">
          <WxVideoPlayer v-if="objData.url" :url="objData.url" />
        </el-row>
        <el-col>
          <el-row style="text-align: center" align="middle">
            <!-- 选择素材 -->
            <el-col :span="12">
              <el-button type="success" @click="openMaterial">
                素材库选择 <Icon icon="ep:circle-check" />
              </el-button>
              <el-dialog title="选择视频" v-model="dialogState.video" width="90%" append-to-body>
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
    <!-- 类型 5：图文 -->
    <el-tab-pane name="news">
      <template #label>
        <el-row align="middle"><Icon icon="ep:reading" /> 图文</el-row>
      </template>
      <el-row>
        <div class="select-item" v-if="objData.articles?.length > 0">
          <WxNews :articles="objData.articles" />
          <el-col class="ope-row">
            <el-button type="danger" circle @click="deleteObj">
              <Icon icon="ep:delete" />
            </el-button>
          </el-col>
        </div>
        <!-- 选择素材 -->
        <el-col :span="24" v-if="!objData.content">
          <el-row style="text-align: center" align="middle">
            <el-col :span="24">
              <el-button type="success" @click="openMaterial">
                {{ newsType === '1' ? '选择已发布图文' : '选择草稿箱图文' }}
                <icon icon="ep:circle-check" />
              </el-button>
            </el-col>
          </el-row>
        </el-col>
        <el-dialog title="选择图文" v-model="dialogState.news" width="90%" append-to-body>
          <WxMaterialSelect
            :obj-data="objData"
            @select-material="selectMaterial"
            :newsType="newsType"
          />
        </el-dialog>
      </el-row>
    </el-tab-pane>
    <!-- 类型 6：音乐 -->
    <el-tab-pane name="music">
      <template #label>
        <el-row align="middle"><Icon icon="ep:service" />音乐</el-row>
      </template>
      <el-row align="middle" justify="center">
        <el-col :span="6">
          <el-row align="middle" justify="center" class="thumb-div">
            <el-col :span="24">
              <el-row align="middle" justify="center">
                <img
                  style="width: 100px"
                  v-if="objData.thumbMediaUrl"
                  :src="objData.thumbMediaUrl"
                />
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
                    <el-button type="primary" link @click="openMaterial" style="margin-left: 5px"
                      >素材库选择
                    </el-button>
                  </el-upload>
                </div>
              </el-row>
            </el-col>
          </el-row>
          <el-dialog title="选择图片" v-model="dialogState.thumb" width="80%" append-to-body>
            <WxMaterialSelect
              :objData="{ type: 'image', accountId: objData.accountId }"
              @select-material="selectMaterial"
            />
          </el-dialog>
        </el-col>
        <el-col :span="18">
          <el-input v-model="objData.title" placeholder="请输入标题" @input="inputContent" />
          <div style="margin: 20px 0"></div>
          <el-input v-model="objData.description" placeholder="请输入描述" @input="inputContent" />
        </el-col>
      </el-row>
      <div style="margin: 20px 0"></div>
      <el-input v-model="objData.musicUrl" placeholder="请输入音乐链接" @input="inputContent" />
      <div style="margin: 20px 0"></div>
      <el-input
        v-model="objData.hqMusicUrl"
        placeholder="请输入高质量音乐链接"
        @input="inputContent"
      />
    </el-tab-pane>
  </el-tabs>
</template>
<script setup lang="ts" name="WxReplySelect">
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import { getAccessToken } from '@/utils/auth'
import { MaterialType, useBeforeUpload } from '@/views/mp/hooks/useUpload'
import type { UploadRawFile } from 'element-plus'

const props = defineProps({
  objData: {
    // 消息对象。
    type: Object, // 设置为 Object 的原因，方便属性的传递
    required: true
  },
  newsType: {
    // 图文类型：1、已发布图文；2、草稿箱图文
    type: String,
    default: '1'
  }
})

const objData = reactive(props.objData)
const message = useMessage() // 消息弹窗
const tempObj = new Map().set(objData.type, Object.assign({}, objData))

// ========== 素材选择的弹窗，是否可见 ==========
type DialogName = 'news' | 'image' | 'voice' | 'video' | 'thumb'
type DialogState = {
  [prop in DialogName]: boolean
}
const dialogState: DialogState = reactive({
  news: false,
  image: false,
  voice: false,
  video: false,
  thumb: false
})

// ========== 文件上传（图片、语音、视频） ==========
const fileList = ref([])
const uploadData = reactive({
  accountId: objData.accountId,
  type: objData.type,
  title: '',
  introduction: ''
})

const UPLOAD_URL = import.meta.env.VITE_API_BASEPATH + '/admin-api/mp/material/upload-temporary'
const HEADERS = { Authorization: 'Bearer ' + getAccessToken() } // 设置上传的请求头部

const beforeImageUpload = (rawFile: UploadRawFile) =>
  useBeforeUpload(MaterialType.Image, 2)(rawFile)
const beforeVoiceUpload = (rawFile: UploadRawFile) =>
  useBeforeUpload(MaterialType.Voice, 10)(rawFile)
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

  // 上传好的文件，本质是个素材，所以可以进行选中
  selectMaterial(res.data)
}

/**
 * 切换消息类型的 tab
 *
 * @param tab tab  没用 暂时删了tab
 */
const handleClick = () => {
  // 设置后续文件上传的文件类型
  uploadData.type = objData.type
  if (uploadData.type === 'music') {
    // 【音乐】上传的是缩略图
    uploadData.type = 'thumb'
  }

  // 从 tempObj 临时缓存中，获取对应的数据，并设置回 objData
  let tempObjItem = tempObj.get(objData.type)
  if (tempObjItem) {
    objData.content = tempObjItem.content ? tempObjItem.content : null
    objData.mediaId = tempObjItem.mediaId ? tempObjItem.mediaId : null
    objData.url = tempObjItem.url ? tempObjItem.url : null
    objData.name = tempObjItem.url ? tempObjItem.name : null
    objData.title = tempObjItem.title ? tempObjItem.title : null
    objData.description = tempObjItem.description ? tempObjItem.description : null
    return
  }
  // 如果获取不到，需要把 objData 复原
  // 必须使用 $set 赋值，不然 input 无法输入内容
  objData.content = ''
  objData.mediaId = ''
  objData.url = ''
  objData.title = ''
  objData.description = ''
}

/**
 * 选择素材，将设置设置到 objData 变量
 *
 * @param item 素材
 */
const selectMaterial = (item) => {
  // 选择好素材，所以隐藏弹窗
  closeMaterial()

  // 创建 tempObjItem 对象，并设置对应的值
  let tempObjItem = {
    type: '',
    articles: [],
    thumbMediaId: '',
    thumbMediaUrl: '',
    introduction: '',
    title: '',
    musicUrl: '',
    hqMusicUrl: '',
    mediaId: '',
    url: '',
    name: '',
    description: ''
  }
  tempObjItem.type = objData.type
  if (objData.type === 'news') {
    tempObjItem.articles = item.content.newsItem
    objData.articles = item.content.newsItem
  } else if (objData.type === 'music') {
    // 音乐需要特殊处理，因为选择的是图片的缩略图
    tempObjItem.thumbMediaId = item.mediaId
    objData.thumbMediaId = item.mediaId
    tempObjItem.thumbMediaUrl = item.url
    objData.thumbMediaUrl = item.url
    // title、introduction、musicUrl、hqMusicUrl：从 objData 到 tempObjItem，避免上传素材后，被覆盖掉
    tempObjItem.title = objData.title || ''
    tempObjItem.introduction = objData.introduction || ''
    tempObjItem.musicUrl = objData.musicUrl || ''
    tempObjItem.hqMusicUrl = objData.hqMusicUrl || ''
  } else if (objData.type === 'image' || objData.type === 'voice') {
    tempObjItem.mediaId = item.mediaId
    objData.mediaId = item.mediaId
    tempObjItem.url = item.url
    objData.url = item.url
    tempObjItem.name = item.name
    objData.name = item.name
  } else if (objData.type === 'video') {
    tempObjItem.mediaId = item.mediaId
    objData.mediaId = item.mediaId
    tempObjItem.url = item.url
    objData.url = item.url
    tempObjItem.name = item.name
    objData.name = item.name
    // title、introduction：从 item 到 tempObjItem，因为素材里有 title、introduction
    if (item.title) {
      objData.title = item.title || ''
      tempObjItem.title = item.title || ''
    }
    if (item.introduction) {
      objData.description = item.introduction || '' // 消息使用的是 description，素材使用的是 introduction，所以转换下
      tempObjItem.description = item.introduction || ''
    }
  } else if (objData.type === 'text') {
    objData.content = item.content || ''
  }
  // 最终设置到临时缓存
  tempObj.set(objData.type, tempObjItem)
}

const openMaterial = () => {
  // if (objData.type === 'news') {
  //   dialogNewsVisible.value = true
  // } else if (objData.type === 'image') {
  //   dialogImageVisible.value = true
  // } else if (objData.type === 'voice') {
  //   dialogVoiceVisible.value = true
  // } else if (objData.type === 'video') {
  //   dialogVideoVisible.value = true
  // } else if (objData.type === 'music') {
  //   dialogThumbVisible.value = true
  // }
  dialogState[objData.type] = true
}

const closeMaterial = () => {
  // dialogNewsVisible.value = false
  // dialogImageVisible.value = false
  // dialogVoiceVisible.value = false
  // dialogVideoVisible.value = false
  // dialogThumbVisible.value = false
  for (const key of ['news', 'image', 'voice', 'video', 'thumb']) {
    dialogState[key] = false
  }
}

const deleteObj = () => {
  if (objData.type === 'news') {
    objData.articles = []
  } else if (objData.type === 'image') {
    objData.mediaId = null
    objData.url = null
    objData.name = null
  } else if (objData.type === 'voice') {
    objData.mediaId = null
    objData.url = null
    objData.name = null
  } else if (objData.type === 'video') {
    objData.mediaId = null
    objData.url = null
    objData.name = null
    objData.title = null
    objData.description = null
  } else if (objData.type === 'music') {
    objData.thumbMediaId = null
    objData.thumbMediaUrl = null
    objData.title = null
    objData.description = null
    objData.musicUrl = null
    objData.hqMusicUrl = null
  } else if (objData.type === 'text') {
    objData.content = null
  }
  // 覆盖缓存
  tempObj.set(objData.type, Object.assign({}, objData))
}

/**
 * 输入时，缓存每次 objData 到 tempObj 中
 *
 * why？不确定为什么 v-model="objData.content" 不能自动缓存，所以通过这样的方式
 */
const inputContent = () => {
  // 覆盖缓存
  tempObj.set(objData.type, Object.assign({}, objData))
}
</script>

<style lang="scss" scoped>
.public-account-management {
  .el-input {
    width: 70%;
    margin-right: 2%;
  }
}

.pagination {
  text-align: right;
  margin-right: 25px;
}

.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.select-item2 {
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.ope-row {
  padding-top: 10px;
  text-align: center;
}

.input-margin-bottom {
  margin-bottom: 2%;
}

.item-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.el-form-item__content {
  line-height: unset !important;
}

.col-select {
  border: 1px solid rgb(234, 234, 234);
  padding: 50px 0px;
  height: 160px;
  width: 49.5%;
}

.col-select2 {
  border: 1px solid rgb(234, 234, 234);
  padding: 50px 0px;
  height: 160px;
}

.col-add {
  border: 1px solid rgb(234, 234, 234);
  padding: 50px 0px;
  height: 160px;
  width: 49.5%;
  float: right;
}

.avatar-uploader-icon {
  border: 1px solid #d9d9d9;
  font-size: 28px;
  color: #8c939d;
  width: 100px !important;
  height: 100px !important;
  line-height: 100px !important;
  text-align: center;
}

.material-img {
  width: 100%;
}

.thumb-div {
  display: inline-block;
  text-align: center;
}

.item-infos {
  width: 30%;
  margin: auto;
}
</style>
