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
  <el-tabs type="border-card" v-model="objDataRef.type" @tab-click="handleClick">
    <!-- 类型 1：文本 -->
    <el-tab-pane name="text">
      <template #label>
        <el-row align="middle">
          <icon icon="ep:document" />
          文本
        </el-row>
      </template>
      <el-input
        type="textarea"
        :rows="5"
        placeholder="请输入内容"
        v-model="objDataRef.content"
        @input="inputContent"
      />
    </el-tab-pane>
    <!-- 类型 2：图片 -->
    <el-tab-pane name="image">
      <template #label>
        <el-row align="middle">
          <icon icon="ep:picture" class="mr-5px" />
          图片
        </el-row>
      </template>
      <!-- 情况一：已经选择好素材、或者上传好图片 -->
      <div class="select-item" v-if="objDataRef.url">
        <img class="material-img" :src="objDataRef.url" />
        <p class="item-name" v-if="objDataRef.name">{{ objDataRef.name }}</p>
        <el-row class="ope-row">
          <el-button type="danger" circle @click="deleteObj">
            <icon icon="ep:delete" />
          </el-button>
        </el-row>
      </div>
      <!-- 情况二：未做完上述操作 -->
      <el-row v-else style="text-align: center" align="middle">
        <!-- 选择素材 -->
        <el-col :span="12" class="col-select">
          <el-button type="success" @click="openMaterial">
            素材库选择
            <icon icon="ep:circle-check" />
          </el-button>
          <el-dialog title="选择图片" v-model="dialogImageVisible" width="90%" append-to-body>
            <wx-material-select :obj-data="objDataRef" @selectMaterial="selectMaterial" />
          </el-dialog>
        </el-col>
        <!-- 文件上传 -->
        <el-col :span="12" class="col-add">
          <el-upload
            :action="actionUrl"
            :headers="headers"
            multiple
            :limit="1"
            :file-list="fileList"
            :data="uploadData"
            :before-upload="beforeImageUpload"
            :on-success="handleUploadSuccess"
          >
            <el-button type="primary">上传图片</el-button>
            <template #tip>
              <span>
                <div class="el-upload__tip"
                  >支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M</div
                ></span
              >
            </template>
          </el-upload>
        </el-col>
      </el-row>
    </el-tab-pane>
    <!-- 类型 3：语音 -->
    <el-tab-pane name="voice">
      <template #label>
        <el-row align="middle">
          <icon icon="ep:phone" />
          语音
        </el-row>
      </template>

      <div class="select-item2" v-if="objDataRef.url">
        <p class="item-name">{{ objDataRef.name }}</p>
        <div class="item-infos">
          <wx-voice-player :url="objDataRef.url" />
        </div>
        <el-row class="ope-row">
          <el-button type="danger" icon="el-icon-delete" circle @click="deleteObj" />
        </el-row>
      </div>
      <el-row v-else style="text-align: center">
        <!-- 选择素材 -->
        <el-col :span="12" class="col-select">
          <el-button type="success" @click="openMaterial">
            素材库选择<i class="el-icon-circle-check el-icon--right"></i>
          </el-button>
          <el-dialog title="选择语音" v-model="dialogVoiceVisible" width="90%" append-to-body>
            <WxMaterialSelect :objData="objData" @selectMaterial="selectMaterial" />
          </el-dialog>
        </el-col>
        <!-- 文件上传 -->
        <el-col :span="12" class="col-add">
          <el-upload
            :action="actionUrl"
            :headers="headers"
            multiple
            :limit="1"
            :file-list="fileList"
            :data="uploadData"
            :before-upload="beforeVoiceUpload"
            :on-success="handleUploadSuccess"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip"
                >格式支持 mp3/wma/wav/amr，文件大小不超过 2M，播放长度不超过 60s
              </div>
            </template>
          </el-upload>
        </el-col>
      </el-row>
    </el-tab-pane>
    <!-- 类型 4：视频 -->
    <el-tab-pane name="video">
      <template #label>
        <el-row align="middle">
          <icon icon="ep:share" />
          视频
        </el-row>
      </template>
      <el-row>
        <el-input
          v-model="objDataRef.title"
          class="input-margin-bottom"
          placeholder="请输入标题"
          @input="inputContent"
        />
        <el-input
          class="input-margin-bottom"
          v-model="objDataRef.description"
          placeholder="请输入描述"
          @input="inputContent"
        />
        <div style="text-align: center">
          <wx-video-player v-if="objDataRef.url" :url="objDataRef.url" />
        </div>
        <el-col>
          <el-row style="text-align: center" align="middle">
            <!-- 选择素材 -->
            <el-col :span="12">
              <el-button type="success" @click="openMaterial">
                素材库选择
                <icon icon="ep:circle-check" />
              </el-button>
              <el-dialog title="选择视频" v-model="dialogVideoVisible" width="90%" append-to-body>
                <wx-material-select :objData="objDataRef" @selectMaterial="selectMaterial" />
              </el-dialog>
            </el-col>
            <!-- 文件上传 -->
            <el-col :span="12">
              <el-upload
                :action="actionUrl"
                :headers="headers"
                multiple
                :limit="1"
                :file-list="fileList"
                :data="uploadData"
                :before-upload="beforeVideoUpload"
                :on-success="handleUploadSuccess"
              >
                <el-button type="primary"
                  >新建视频
                  <icon icon="ep:upload" />
                </el-button>
              </el-upload>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-tab-pane>
    <!-- 类型 5：图文 -->
    <el-tab-pane name="news">
      <template #label>
        <el-row align="middle">
          <icon icon="ep:reading" />
          图文
        </el-row>
      </template>
      <el-row>
        <div class="select-item" v-if="objDataRef.articles.size > 0">
          <wx-news :articles="objDataRef.articles" />
          <el-col class="ope-row">
            <el-button type="danger" circle @click="deleteObj">
              <icon icon="ep:delete" />
            </el-button>
          </el-col>
        </div>
        <!-- 选择素材 -->
        <el-col :span="24" v-if="!objDataRef.content">
          <el-row style="text-align: center" align="middle">
            <el-col :span="24">
              <el-button type="success" @click="openMaterial"
                >{{ newsType === '1' ? '选择已发布图文' : '选择草稿箱图文' }}
                <icon icon="ep:circle-check" />
              </el-button>
            </el-col>
          </el-row>
        </el-col>
        <el-dialog title="选择图文" v-model="dialogNewsVisible" width="90%" append-to-body>
          <wx-material-select
            :objData="objDataRef"
            @selectMaterial="selectMaterial"
            :newsType="newsType"
          />
        </el-dialog>
      </el-row>
    </el-tab-pane>
    <!-- 类型 6：音乐 -->
    <el-tab-pane name="music">
      <template #label>
        <el-row align="middle">
          <icon icon="ep:service" />
          音乐
        </el-row>
      </template>
      <el-row align="middle" justify="center">
        <el-col :span="6">
          <el-row align="middle" justify="center" class="thumb-div">
            <el-col :span="24">
              <el-row align="middle" justify="center">
                <img
                  style="width: 100px"
                  v-if="objDataRef.thumbMediaUrl"
                  :src="objDataRef.thumbMediaUrl"
                />
                <icon v-else icon="ep:plus" />
              </el-row>
              <el-row align="middle" justify="center" style="margin-top: 2%">
                <div class="thumb-but">
                  <el-upload
                    :action="actionUrl"
                    :headers="headers"
                    multiple
                    :limit="1"
                    :file-list="fileList"
                    :data="uploadData"
                    :before-upload="beforeThumbImageUpload"
                    :on-success="handleUploadSuccess"
                  >
                    <template #trigger>
                      <el-button type="text">本地上传</el-button>
                    </template>
                    <el-button type="text" @click="openMaterial" style="margin-left: 5px"
                      >素材库选择
                    </el-button>
                  </el-upload>
                </div>
              </el-row>
            </el-col>
          </el-row>
          <el-dialog title="选择图片" v-model="dialogThumbVisible" width="80%" append-to-body>
            <wx-material-select
              :objData="{ type: 'image', accountId: objDataRef.accountId }"
              @selectMaterial="selectMaterial"
            />
          </el-dialog>
        </el-col>
        <el-col :span="18">
          <el-input v-model="objDataRef.title" placeholder="请输入标题" @input="inputContent" />
          <div style="margin: 20px 0"></div>
          <el-input
            v-model="objDataRef.description"
            placeholder="请输入描述"
            @input="inputContent"
          />
        </el-col>
      </el-row>
      <div style="margin: 20px 0"></div>
      <el-input v-model="objDataRef.musicUrl" placeholder="请输入音乐链接" @input="inputContent" />
      <div style="margin: 20px 0"></div>
      <el-input
        v-model="objDataRef.hqMusicUrl"
        placeholder="请输入高质量音乐链接"
        @input="inputContent"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" name="WxReplySelect">
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'

import { getAccessToken } from '@/utils/auth'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    WxNews,
    WxMaterialSelect,
    WxVoicePlayer,
    WxVideoPlayer
  },
  props: {
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
  },
  setup(props) {
    const objDataRef = reactive(props.objData)
    const message = useMessage() // 消息弹窗
    const tempObj = new Map().set(objDataRef.type, Object.assign({}, objDataRef))
    // ========== 素材选择的弹窗，是否可见 ==========
    const dialogNewsVisible = ref(false) // 图文
    const dialogImageVisible = ref(false) // 图片
    const dialogVoiceVisible = ref(false) // 语音
    const dialogVideoVisible = ref(false) // 视频
    const dialogThumbVisible = ref(false) // 缩略图
    // ========== 文件上传（图片、语音、视频） ==========
    const fileList = ref([])
    const uploadData = reactive({
      accountId: undefined,
      type: objDataRef.type,
      title: '',
      introduction: ''
    })
    const actionUrl = ref(
      import.meta.env.VITE_API_BASEPATH + '/admin-api/mp/material/upload-temporary'
    )
    const headers = ref({ Authorization: 'Bearer ' + getAccessToken() }) // 设置上传的请求头部
    const beforeThumbImageUpload = (file) => {
      const isType =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/gif' ||
        file.type === 'image/bmp' ||
        file.type === 'image/jpg'
      if (!isType) {
        message.error('上传图片格式不对!')
        return false
      }
      const isLt = file.size / 1024 / 1024 < 2
      if (!isLt) {
        message.error('上传图片大小不能超过 2M!')
        return false
      }
      uploadData.accountId = objDataRef.accountId
      return true
    }
    const beforeVoiceUpload = (file) => {
      // 校验格式
      const isType =
        file.type === 'audio/mp3' ||
        file.type === 'audio/mpeg' ||
        file.type === 'audio/wma' ||
        file.type === 'audio/wav' ||
        file.type === 'audio/amr'
      if (!isType) {
        message.error('上传语音格式不对!' + file.type)
        return false
      }
      // 校验大小
      const isLt = file.size / 1024 / 1024 < 2
      if (!isLt) {
        message.error('上传语音大小不能超过 2M!')
        return false
      }
      uploadData.accountId = objDataRef.accountId
      return true
    }
    const beforeImageUpload = (file) => {
      // 校验格式
      const isType =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/gif' ||
        file.type === 'image/bmp' ||
        file.type === 'image/jpg'
      if (!isType) {
        message.error('上传图片格式不对!')
        return false
      }
      // 校验大小
      const isLt = file.size / 1024 / 1024 < 2
      if (!isLt) {
        message.error('上传图片大小不能超过 2M!')
        return false
      }
      uploadData.accountId = objDataRef.accountId
      return true
    }
    const beforeVideoUpload = (file) => {
      // 校验格式
      const isType = file.type === 'video/mp4'
      if (!isType) {
        message.error('上传视频格式不对!')
        return false
      }
      // 校验大小
      const isLt = file.size / 1024 / 1024 < 10
      if (!isLt) {
        message.error('上传视频大小不能超过 10M!')
        return false
      }
      uploadData.accountId = objDataRef.accountId
      return true
    }
    const handleUploadSuccess = (response) => {
      if (response.code !== 0) {
        message.error('上传出错：' + response.msg)
        return false
      }

      // 清空上传时的各种数据
      fileList.value = []
      uploadData.title = ''
      uploadData.introduction = ''

      // 上传好的文件，本质是个素材，所以可以进行选中
      let item = response.data
      selectMaterial(item)
    }
    /**
     * 切换消息类型的 tab
     *
     * @param tab tab  没用 暂时删了tab
     */
    const handleClick = () => {
      // 设置后续文件上传的文件类型
      uploadData.type = objDataRef.type
      if (uploadData.type === 'music') {
        // 【音乐】上传的是缩略图
        uploadData.type = 'thumb'
      }

      // 从 tempObj 临时缓存中，获取对应的数据，并设置回 objDataRef
      let tempObjItem = tempObj.get(objDataRef.type)
      if (tempObjItem) {
        objDataRef.content = tempObjItem.content ? tempObjItem.content : null
        objDataRef.mediaId = tempObjItem.mediaId ? tempObjItem.mediaId : null
        objDataRef.url = tempObjItem.url ? tempObjItem.url : null
        objDataRef.name = tempObjItem.url ? tempObjItem.name : null
        objDataRef.title = tempObjItem.title ? tempObjItem.title : null
        objDataRef.description = tempObjItem.description ? tempObjItem.description : null
        return
      }
      // 如果获取不到，需要把 objDataRef 复原
      // 必须使用 $set 赋值，不然 input 无法输入内容
      objDataRef.content = ''
      objDataRef.mediaId = ''
      objDataRef.url = ''
      objDataRef.title = ''
      objDataRef.description = ''
    }
    /**
     * 选择素材，将设置设置到 objDataRef 变量
     *
     * @param item 素材
     */
    const selectMaterial = (item) => {
      // 选择好素材，所以隐藏弹窗
      closeMaterial()

      // 创建 tempObjItem 对象，并设置对应的值
      let tempObjItem = {
        type: '',
        articles: '',
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
      tempObjItem.type = objDataRef.type
      if (objDataRef.type === 'news') {
        tempObjItem.articles = item.content.newsItem
        objDataRef.articles = item.content.newsItem
      } else if (objDataRef.type === 'music') {
        // 音乐需要特殊处理，因为选择的是图片的缩略图
        tempObjItem.thumbMediaId = item.mediaId
        objDataRef.thumbMediaId = item.mediaId
        tempObjItem.thumbMediaUrl = item.url
        objDataRef.thumbMediaUrl = item.url
        // title、introduction、musicUrl、hqMusicUrl：从 objDataRef 到 tempObjItem，避免上传素材后，被覆盖掉
        tempObjItem.title = objDataRef.title || ''
        tempObjItem.introduction = objDataRef.introduction || ''
        tempObjItem.musicUrl = objDataRef.musicUrl || ''
        tempObjItem.hqMusicUrl = objDataRef.hqMusicUrl || ''
      } else if (objDataRef.type === 'image' || objDataRef.type === 'voice') {
        tempObjItem.mediaId = item.mediaId
        objDataRef.mediaId = item.mediaId
        tempObjItem.url = item.url
        objDataRef.url = item.url
        tempObjItem.name = item.name
        objDataRef.name = item.name
      } else if (objDataRef.type === 'video') {
        tempObjItem.mediaId = item.mediaId
        objDataRef.mediaId = item.mediaId
        tempObjItem.url = item.url
        objDataRef.url = item.url
        tempObjItem.name = item.name
        objDataRef.name = item.name
        // title、introduction：从 item 到 tempObjItem，因为素材里有 title、introduction
        if (item.title) {
          objDataRef.title = item.title || ''
          tempObjItem.title = item.title || ''
        }
        if (item.introduction) {
          objDataRef.description = item.introduction || '' // 消息使用的是 description，素材使用的是 introduction，所以转换下
          tempObjItem.description = item.introduction || ''
        }
      } else if (objDataRef.type === 'text') {
        objDataRef.content = item.content || ''
      }
      // 最终设置到临时缓存
      tempObj.set(objDataRef.type, tempObjItem)
    }
    const openMaterial = () => {
      if (objDataRef.type === 'news') {
        dialogNewsVisible.value = true
      } else if (objDataRef.type === 'image') {
        dialogImageVisible.value = true
      } else if (objDataRef.type === 'voice') {
        dialogVoiceVisible.value = true
      } else if (objDataRef.type === 'video') {
        dialogVideoVisible.value = true
      } else if (objDataRef.type === 'music') {
        dialogThumbVisible.value = true
      }
    }
    const closeMaterial = () => {
      dialogNewsVisible.value = false
      dialogImageVisible.value = false
      dialogVoiceVisible.value = false
      dialogVideoVisible.value = false
      dialogThumbVisible.value = false
    }
    const deleteObj = () => {
      if (objDataRef.type === 'news') {
        objDataRef.articles = ''
      } else if (objDataRef.type === 'image') {
        objDataRef.mediaId = null
        objDataRef.url = null
        objDataRef.name = null
      } else if (objDataRef.type === 'voice') {
        objDataRef.mediaId = null
        objDataRef.url = null
        objDataRef.name = null
      } else if (objDataRef.type === 'video') {
        objDataRef.mediaId = null
        objDataRef.url = null
        objDataRef.name = null
        objDataRef.title = null
        objDataRef.description = null
      } else if (objDataRef.type === 'music') {
        objDataRef.thumbMediaId = null
        objDataRef.thumbMediaUrl = null
        objDataRef.title = null
        objDataRef.description = null
        objDataRef.musicUrl = null
        objDataRef.hqMusicUrl = null
      } else if (objDataRef.type === 'text') {
        objDataRef.content = null
      }
      // 覆盖缓存
      tempObj.set(objDataRef.type, Object.assign({}, objDataRef))
    }
    /**
     * 输入时，缓存每次 objDataRef 到 tempObj 中
     *
     * why？不确定为什么 v-model="objDataRef.content" 不能自动缓存，所以通过这样的方式
     */
    const inputContent = () => {
      // 覆盖缓存
      tempObj.set(objDataRef.type, Object.assign({}, objDataRef))
    }
    return {
      inputContent,
      dialogNewsVisible,
      deleteObj,
      openMaterial,
      handleClick,
      beforeImageUpload,
      beforeVoiceUpload,
      handleUploadSuccess,
      beforeVideoUpload,
      selectMaterial,
      dialogImageVisible,
      dialogVoiceVisible,
      dialogThumbVisible,
      actionUrl,
      objDataRef,
      headers,
      fileList,
      beforeThumbImageUpload,
      uploadData,
      dialogVideoVisible
    }
  }
})
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
