<template>
  <doc-alert title="公众号素材" url="https://doc.iocoder.cn/mp/material/" />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="公众号" prop="accountId">
        <el-select v-model="queryParams.accountId" placeholder="请选择公众号" class="!w-240px">
          <el-option
            v-for="item in accountList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-tabs v-model="type" @tab-change="handleTabChange">
      <!-- tab 1：图片  -->
      <el-tab-pane name="image">
        <template #label>
          <span><Icon icon="ep:picture" />图片</span>
        </template>
        <div class="add_but" v-hasPermi="['mp:material:upload-permanent']">
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
            <el-button type="primary" plain>点击上传</el-button>
            <template #tip>
              <span class="el-upload__tip" style="margin-left: 5px">
                支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M
              </span>
            </template>
          </el-upload>
        </div>
        <div class="waterfall" v-loading="loading">
          <div class="waterfall-item" v-for="item in list" :key="item.id">
            <a target="_blank" :href="item.url">
              <img class="material-img" :src="item.url" />
              <div class="item-name">{{ item.name }}</div>
            </a>
            <el-row class="ope-row" justify="center">
              <el-button
                type="danger"
                circle
                @click="handleDelete(item)"
                v-hasPermi="['mp:material:delete']"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </el-row>
          </div>
        </div>
        <!-- 分页组件 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-tab-pane>

      <!-- tab 2：语音  -->
      <el-tab-pane name="voice">
        <template #label>
          <span><Icon icon="ep:microphone" />语音</span>
        </template>
        <div class="add_but" v-hasPermi="['mp:material:upload-permanent']">
          <el-upload
            :action="actionUrl"
            :headers="headers"
            multiple
            :limit="1"
            :file-list="fileList"
            :data="uploadData"
            :on-success="handleUploadSuccess"
            :before-upload="beforeVoiceUpload"
          >
            <el-button type="primary" plain>点击上传</el-button>
            <template #tip>
              <span class="el-upload__tip" style="margin-left: 5px">
                格式支持 mp3/wma/wav/amr，文件大小不超过 2M，播放长度不超过 60s
              </span>
            </template>
          </el-upload>
        </div>
        <el-table :data="list" stripe border v-loading="loading" style="margin-top: 10px">
          <el-table-column label="编号" align="center" prop="mediaId" />
          <el-table-column label="文件名" align="center" prop="name" />
          <el-table-column label="语音" align="center">
            <template #default="scope">
              <WxVoicePlayer :url="scope.row.url" />
            </template>
          </el-table-column>
          <el-table-column label="上传时间" align="center" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ formatDate(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
              <el-button type="primary" link plain @click="handleDownload(scope.row)">
                <Icon icon="ep:download" />下载
              </el-button>
              <el-button
                type="primary"
                link
                plain
                @click="handleDelete(scope.row)"
                v-hasPermi="['mp:material:delete']"
              >
                <Icon icon="ep:delete" />删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页组件 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-tab-pane>

      <!-- tab 3：视频 -->
      <el-tab-pane name="video">
        <template #label>
          <span><Icon icon="ep:video-play" /> 视频</span>
        </template>
        <div class="add_but" v-hasPermi="['mp:material:upload-permanent']">
          <el-button type="primary" plain @click="handleAddVideo">新建视频</el-button>
        </div>
        <!-- 新建视频的弹窗 -->
        <el-dialog
          title="新建视频"
          v-model="dialogVideoVisible"
          width="600px"
          v-loading="addMaterialLoading"
        >
          <el-upload
            :action="actionUrl"
            :headers="headers"
            multiple
            :limit="1"
            :file-list="fileList"
            :data="uploadData"
            :before-upload="beforeVideoUpload"
            :on-success="handleUploadSuccess"
            ref="uploadVideoRef"
            :auto-upload="false"
          >
            <template #trigger>
              <el-button size="small" type="primary">选择视频</el-button>
            </template>
            <span class="el-upload__tip" style="margin-left: 10px"
              >格式支持 MP4，文件大小不超过 10MB</span
            >
          </el-upload>
          <el-form :model="uploadData" :rules="uploadRules" ref="uploadFormRef" label-width="80px">
            <el-row>
              <el-form-item label="标题" prop="title">
                <el-input
                  v-model="uploadData.title"
                  placeholder="标题将展示在相关播放页面，建议填写清晰、准确、生动的标题"
                />
              </el-form-item>
            </el-row>
            <el-row>
              <el-form-item label="描述" prop="introduction">
                <el-input
                  :rows="3"
                  type="textarea"
                  v-model="uploadData.introduction"
                  placeholder="介绍语将展示在相关播放页面，建议填写简洁明确、有信息量的内容"
                />
              </el-form-item>
            </el-row>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="cancelVideo">取 消</el-button>
              <el-button type="primary" @click="submitVideo">提 交</el-button>
            </div>
          </template>
        </el-dialog>

        <el-table :data="list" stripe border v-loading="loading" style="margin-top: 10px">
          <el-table-column label="编号" align="center" prop="mediaId" />
          <el-table-column label="文件名" align="center" prop="name" />
          <el-table-column label="标题" align="center" prop="title" />
          <el-table-column label="介绍" align="center" prop="introduction" />
          <el-table-column label="视频" align="center">
            <template #default="scope">
              <WxVideoPlayer :url="scope.row.url" />
            </template>
          </el-table-column>
          <el-table-column label="上传时间" align="center" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ formatDate(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" link plain @click="handleDownload(scope.row)"
                ><Icon icon="ep:download" />下载</el-button
              >
              <el-button
                type="primary"
                link
                size="small"
                plain
                @click="handleDelete(scope.row)"
                v-hasPermi="['mp:material:delete']"
              >
                <Icon icon="ep:delete" />删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页组件 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup name="MpMaterial">
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import { getSimpleAccountList } from '@/api/mp/account'
import { getMaterialPage, deletePermanentMaterial } from '@/api/mp/material'
import { getAccessToken } from '@/utils/auth'
import { formatDate } from '@/utils/formatTime'

const BASE_URL = import.meta.env.VITE_BASE_URL

const message = useMessage()

const queryFormRef = ref()
const uploadFormRef = ref()
const uploadVideoRef = ref()

const type = ref('image')
// 遮罩层
const loading = ref(false)
// 总条数
const total = ref(0)
// 数据列表
const list = ref([])
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: undefined,
  permanent: true
})

const actionUrl = BASE_URL + '/admin-api/mp/material/upload-permanent'
const headers = { Authorization: 'Bearer ' + getAccessToken() }
const fileList = ref([])
const uploadData = reactive({
  type: 'image',
  title: '',
  introduction: ''
})

// === 视频上传，独有变量 ===
const dialogVideoVisible = ref(false)
const addMaterialLoading = ref(false)
const uploadRules = reactive({
  // 视频上传的校验规则
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  introduction: [{ required: true, message: '请输入描述', trigger: 'blur' }]
})

// 公众号账号列表
const accountList = ref([])

onMounted(() => {
  getSimpleAccountList().then((data) => {
    accountList.value = data
    // 默认选中第一个
    if (accountList.value.length > 0) {
      setAccountId(accountList.value[0].id)
    }
    // 加载数据
    getList()
  })
})

// ======================== 列表查询 ========================
/** 设置账号编号 */
const setAccountId = (accountId) => {
  queryParams.accountId = accountId
  uploadData.accountId = accountId
}

/** 查询列表 */
const getList = () => {
  // 如果没有选中公众号账号，则进行提示。
  if (!queryParams.accountId) {
    message.error('未选中公众号，无法查询草稿箱')
    return false
  }

  loading.value = true
  getMaterialPage({
    ...queryParams,
    type: type.value
  })
    .then((data) => {
      list.value = data.list
      total.value = data.total
    })
    .finally(() => {
      loading.value = false
    })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  // 默认选中第一个
  if (queryParams.accountId) {
    setAccountId(queryParams.accountId)
  }
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    setAccountId(accountList.value[0].id)
  }
  handleQuery()
}

const handleTabChange = (tabName) => {
  // 设置 type
  uploadData.type = tabName
  // 从第一页开始查询
  handleQuery()
}

// ======================== 文件上传 ========================
const beforeImageUpload = (file) => {
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
  loading.value = true
  return true
}

const beforeVoiceUpload = (file) => {
  const isType =
    file.type === 'audio/mp3' ||
    file.type === 'audio/wma' ||
    file.type === 'audio/wav' ||
    file.type === 'audio/amr'
  const isLt = file.size / 1024 / 1024 < 2
  if (!isType) {
    message.error('上传语音格式不对!')
    return false
  }
  if (!isLt) {
    message.error('上传语音大小不能超过 2M!')
    return false
  }
  loading.value = true
  return true
}

const beforeVideoUpload = (file) => {
  const isType = file.type === 'video/mp4'
  if (!isType) {
    message.error('上传视频格式不对!')
    return false
  }
  const isLt = file.size / 1024 / 1024 < 10
  if (!isLt) {
    message.error('上传视频大小不能超过 10M!')
    return false
  }
  addMaterialLoading.value = true
  return true
}

const handleUploadSuccess = (response, file, fileList) => {
  loading.value = false
  addMaterialLoading.value = false
  if (response.code !== 0) {
    message.error('上传出错：' + response.msg)
    return false
  }

  // 清空上传时的各种数据
  dialogVideoVisible.value = false
  fileList.value = []
  uploadData.title = ''
  uploadData.introduction = ''

  // 加载数据
  getList()
}

// 下载文件
const handleDownload = (row) => {
  window.open(row.url, '_blank')
}

// 提交 video 新建的表单
const submitVideo = () => {
  uploadFormRef.value.validate((valid) => {
    if (!valid) {
      return false
    }
    uploadVideoRef.value.submit()
  })
}

const handleAddVideo = () => {
  resetVideo()
  dialogVideoVisible.value = true
}

/** 取消按钮 */
const cancelVideo = () => {
  dialogVideoVisible.value = false
  resetVideo()
}

/** 表单重置 */
const resetVideo = () => {
  fileList.value = []
  uploadData.title = ''
  uploadData.introduction = ''
  uploadFormRef.value?.resetFields()
}

// ======================== 其它操作 ========================
const handleDelete = async (item) => {
  await message.confirm('此操作将永久删除该文件, 是否继续?')
  await deletePermanentMaterial(item.id)
  message.alertSuccess('删除成功')
}
</script>

<style lang="scss" scoped>
/*瀑布流样式*/
.waterfall {
  width: 100%;
  column-gap: 10px;
  column-count: 5;
  margin-top: 10px; /* 芋道源码：增加 10px，避免顶着上面 */
}
.waterfall-item {
  padding: 10px;
  margin-bottom: 10px;
  break-inside: avoid;
  border: 1px solid #eaeaea;
}
.material-img {
  width: 100%;
}
p {
  line-height: 30px;
}
@media (min-width: 992px) and (max-width: 1300px) {
  .waterfall {
    column-count: 3;
  }
  p {
    color: red;
  }
}
@media (min-width: 768px) and (max-width: 991px) {
  .waterfall {
    column-count: 2;
  }
  p {
    color: orange;
  }
}
@media (max-width: 767px) {
  .waterfall {
    column-count: 1;
  }
}
/*瀑布流样式*/
</style>
