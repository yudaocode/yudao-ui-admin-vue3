<template>
  <div class="app-container">
    <doc-alert title="公众号图文" url="https://doc.iocoder.cn/mp/article/" />

    <!-- 搜索工作栏 -->
    <el-form :model="queryParams" ref="queryFormRef" size="small" :inline="true" label-width="68px">
      <el-form-item label="公众号" prop="accountId">
        <el-select v-model="queryParams.accountId" placeholder="请选择公众号">
          <el-option
            v-for="item in accountList"
            :key="parseInt(item.id)"
            :label="item.name"
            :value="parseInt(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          size="small"
          @click="handleAdd"
          v-hasPermi="['mp:draft:create']"
          ><Icon icon="ep:plus" />新增
        </el-button>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <div class="waterfall" v-loading="loading">
      <template v-for="item in list" :key="item.articleId">
        <div class="waterfall-item" v-if="item.content && item.content.newsItem">
          <wx-news :articles="item.content.newsItem" />
          <!-- 操作按钮 -->
          <el-row class="ope-row">
            <el-button
              type="success"
              circle
              @click="handlePublish(item)"
              v-hasPermi="['mp:free-publish:submit']"
              ><Icon icon="fa:upload"
            /></el-button>
            <el-button
              type="primary"
              circle
              @click="handleUpdate(item)"
              v-hasPermi="['mp:draft:update']"
              ><Icon icon="ep:edit"
            /></el-button>
            <el-button
              type="danger"
              circle
              @click="handleDelete(item)"
              v-hasPermi="['mp:draft:delete']"
              ><Icon icon="ep:delete"
            /></el-button>
          </el-row>
        </div>
      </template>
    </div>
    <!-- 分页记录 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改草稿对话框 -->
    <Teleport to="body">
      <el-dialog
        :title="operateMaterial === 'add' ? '新建图文' : '修改图文'"
        width="80%"
        top="20px"
        v-model="dialogNewsVisible"
        :before-close="dialogNewsClose"
        :close-on-click-modal="false"
      >
        <div class="left">
          <div class="select-item">
            <div v-for="(news, index) in articlesAdd" :key="news.id">
              <div
                class="news-main father"
                v-if="index === 0"
                :class="{ activeAddNews: isActiveAddNews === index }"
                @click="activeNews(index)"
              >
                <div class="news-content">
                  <img class="material-img" v-if="news.thumbUrl" :src="news.thumbUrl" />
                  <div class="news-content-title">{{ news.title }}</div>
                </div>
                <div class="child" v-if="articlesAdd.length > 1">
                  <el-button size="small" @click="downNews(index)"
                    ><Icon icon="ep:sort-down" />下移</el-button
                  >
                  <el-button v-if="operateMaterial === 'add'" size="small" @click="minusNews(index)"
                    ><Icon icon="ep:delete" />删除
                  </el-button>
                </div>
              </div>
              <div
                class="news-main-item father"
                v-if="index > 0"
                :class="{ activeAddNews: isActiveAddNews === index }"
                @click="activeNews(index)"
              >
                <div class="news-content-item">
                  <div class="news-content-item-title">{{ news.title }}</div>
                  <div class="news-content-item-img">
                    <img
                      class="material-img"
                      v-if="news.thumbUrl"
                      :src="news.thumbUrl"
                      height="100%"
                    />
                  </div>
                </div>
                <div class="child">
                  <el-button
                    v-if="articlesAdd.length > index + 1"
                    size="small"
                    @click="downNews(index)"
                    ><Icon icon="ep:sort-down" />下移
                  </el-button>
                  <el-button size="small" @click="upNews(index)"
                    ><Icon icon="ep:sort-up" />上移</el-button
                  >
                  <el-button
                    v-if="operateMaterial === 'add'"
                    type="danger"
                    size="small"
                    @click="minusNews(index)"
                    ><Icon icon="ep:delete" />删除
                  </el-button>
                </div>
              </div>
            </div>
            <el-row justify="center" class="ope-row">
              <el-button
                type="primary"
                circle
                @click="plusNews(item)"
                v-if="articlesAdd.length < 8 && operateMaterial === 'add'"
              >
                <Icon icon="ep:plus" />
              </el-button>
            </el-row>
          </div>
        </div>
        <div class="right" v-loading="addMaterialLoading" v-if="articlesAdd.length > 0">
          <br />
          <br />
          <br />
          <br />
          <!-- 标题、作者、原文地址 -->
          <el-input v-model="articlesAdd[isActiveAddNews].title" placeholder="请输入标题（必填）" />
          <el-input
            v-model="articlesAdd[isActiveAddNews].author"
            placeholder="请输入作者"
            style="margin-top: 5px"
          />
          <el-input
            v-model="articlesAdd[isActiveAddNews].contentSourceUrl"
            placeholder="请输入原文地址"
            style="margin-top: 5px"
          />
          <!-- 封面和摘要 -->
          <div class="input-tt">封面和摘要：</div>
          <div>
            <div class="thumb-div">
              <img
                class="material-img"
                v-if="articlesAdd[isActiveAddNews].thumbUrl"
                :src="articlesAdd[isActiveAddNews].thumbUrl"
                :class="isActiveAddNews === 0 ? 'avatar' : 'avatar1'"
              />
              <Icon
                v-else
                icon="ep:plus"
                class="avatar-uploader-icon"
                :class="isActiveAddNews === 0 ? 'avatar' : 'avatar1'"
              />
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
                    <el-button size="small" type="primary">本地上传</el-button>
                  </template>
                  <el-button
                    size="small"
                    type="primary"
                    @click="openMaterial"
                    style="margin-left: 5px"
                    >素材库选择</el-button
                  >
                  <template #tip>
                    <div class="el-upload__tip">支持 bmp/png/jpeg/jpg/gif 格式，大小不超过 2M</div>
                  </template>
                </el-upload>
              </div>
              <Teleport to="body">
                <el-dialog title="选择图片" v-model="dialogImageVisible" width="80%">
                  <WxMaterialSelect
                    ref="materialSelectRef"
                    :objData="{ type: 'image', accountId: queryParams.accountId }"
                    @select-material="selectMaterial"
                  />
                </el-dialog>
              </Teleport>
            </div>
            <el-input
              :rows="8"
              type="textarea"
              v-model="articlesAdd[isActiveAddNews].digest"
              placeholder="请输入摘要"
              class="digest"
              maxlength="120"
              style="float: right"
            />
          </div>
          <!--富文本编辑器组件-->
          <el-row>
            <wx-editor
              v-model="articlesAdd[isActiveAddNews].content"
              :account-id="uploadData.accountId"
              v-if="hackResetEditor"
            />
          </el-row>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogNewsVisible = false">取 消</el-button>
            <el-button type="primary" @click="submitForm">提 交</el-button>
          </div>
        </template>
      </el-dialog>
    </Teleport>
  </div>
</template>

<script setup name="MpDraft">
import { ref, onMounted, reactive, nextTick } from 'vue'
import WxEditor from '@/views/mp/components/wx-editor/WxEditor.vue'
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import { getAccessToken } from '@/utils/auth'
import { createDraft, deleteDraft, getDraftPage, updateDraft } from '@/api/mp/draft'
import { getSimpleAccountList } from '@/api/mp/account'
import { submitFreePublish } from '@/api/mp/freePublish'
// 可以用改本地数据模拟，避免API调用超限
// import drafts from './mock'

const BASE_URL = import.meta.env.VITE_BASE_URL

const message = useMessage()

const materialSelectRef = ref()
const queryFormRef = ref()

// 遮罩层
const loading = ref(false)
// 显示搜索条件
// 总条数
const total = ref(0)
// 数据列表
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: undefined
})

// ========== 文件上传 ==========
const actionUrl = ref(BASE_URL + '/admin-api/mp/material/upload-permanent') // 上传永久素材的地址
const headers = ref({ Authorization: 'Bearer ' + getAccessToken() }) // 设置上传的请求头部
const fileList = ref([])
const uploadData = reactive({
  type: 'image',
  accountId: 1
})

// ========== 草稿新建 or 修改 ==========
const dialogNewsVisible = ref(false)
const addMaterialLoading = ref(false) // 添加草稿的 loading 标识
const articlesAdd = ref([])
const isActiveAddNews = ref(0)
const dialogImageVisible = ref(false)
const operateMaterial = ref('add')
const articlesMediaId = ref('')
const hackResetEditor = ref(false)
// 公众号账号列表
const accountList = ref([])

onMounted(async () => {
  accountList.value = await getSimpleAccountList()
  // 选中第一个
  if (accountList.value.length > 0) {
    // @ts-ignore
    queryParams.accountId = accountList.value[0].id
  }
  await getList()
})

// ======================== 列表查询 ========================
/** 设置账号编号 */
const setAccountId = (accountId) => {
  queryParams.accountId = accountId
  uploadData.accountId = accountId
}

/** 查询列表 */
const getList = async () => {
  // 如果没有选中公众号账号，则进行提示。
  if (!queryParams.accountId) {
    message.error('未选中公众号，无法查询草稿箱')
    return false
  }

  loading.value = true
  try {
    const drafts = await getDraftPage(queryParams)
    drafts.list.forEach((item) => {
      const newsItem = item.content.newsItem
      // 将 thumbUrl 转成 picUrl，保证 wx-news 组件可以预览封面
      newsItem.forEach((article) => {
        article.picUrl = article.thumbUrl
      })
    })
    list.value = drafts.list
    total.value = drafts.total
  } finally {
    loading.value = false
  }
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
  queryFormRef.value.resetFields()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    setAccountId(accountList.value[0].id)
  }
  handleQuery()
}

// ======================== 新增/修改草稿 ========================
/** 新增按钮操作 */
const handleAdd = () => {
  resetEditor()
  reset()
  // 打开表单，并设置初始化
  operateMaterial.value = 'add'
  dialogNewsVisible.value = true
}

/** 更新按钮操作 */
const handleUpdate = (item) => {
  resetEditor()
  reset()
  articlesMediaId.value = item.mediaId
  articlesAdd.value = JSON.parse(JSON.stringify(item.content.newsItem))
  // 打开表单，并设置初始化
  operateMaterial.value = 'edit'
  dialogNewsVisible.value = true
}

/** 提交按钮 */
const submitForm = () => {
  addMaterialLoading.value = true
  if (operateMaterial.value === 'add') {
    createDraft(queryParams.accountId, articlesAdd.value)
      .then(() => {
        message.notifySuccess('新增成功')
        dialogNewsVisible.value = false
        getList()
      })
      .finally(() => {
        addMaterialLoading.value = false
      })
  } else {
    updateDraft(queryParams.accountId, articlesMediaId.value, articlesAdd.value)
      .then(() => {
        message.notifySuccess('更新成功')
        dialogNewsVisible.value = false
        getList()
      })
      .finally(() => {
        addMaterialLoading.value = false
      })
  }
}

// 关闭弹窗
const dialogNewsClose = async (done) => {
  try {
    await message.confirm('修改内容可能还未保存，确定关闭吗?')
    reset()
    resetEditor()
    done()
  } catch {}
}

// 表单重置
const reset = () => {
  isActiveAddNews.value = 0
  articlesAdd.value = [buildEmptyArticle()]
}

// 表单 Editor 重置
const resetEditor = () => {
  hackResetEditor.value = false // 销毁组件
  nextTick(() => {
    hackResetEditor.value = true // 重建组件
  })
}

// 将图文向下移动
const downNews = (index) => {
  let temp = articlesAdd.value[index]
  articlesAdd.value[index] = articlesAdd.value[index + 1]
  articlesAdd.value[index + 1] = temp
  isActiveAddNews.value = index + 1
}

// 将图文向上移动
const upNews = (index) => {
  let temp = articlesAdd.value[index]
  articlesAdd.value[index] = articlesAdd.value[index - 1]
  articlesAdd.value[index - 1] = temp
  isActiveAddNews.value = index - 1
}

// 选中指定 index 的图文
const activeNews = (index) => {
  resetEditor()
  isActiveAddNews.value = index
}

// 删除指定 index 的图文
const minusNews = async (index) => {
  try {
    await message.confirm('确定删除该图文吗?')
    articlesAdd.value.splice(index, 1)
    if (isActiveAddNews.value === index) {
      isActiveAddNews.value = 0
    }
  } catch {}
}

// 添加一个图文
const plusNews = () => {
  articlesAdd.value.push(buildEmptyArticle())
  isActiveAddNews.value = articlesAdd.value.length - 1
}

// 创建空的 article
const buildEmptyArticle = () => {
  return {
    title: '',
    thumbMediaId: '',
    author: '',
    digest: '',
    showCoverPic: '',
    content: '',
    contentSourceUrl: '',
    needOpenComment: '',
    onlyFansCanComment: '',
    thumbUrl: ''
  }
}

// ======================== 文件上传 ========================
const beforeThumbImageUpload = (file) => {
  addMaterialLoading.value = true
  const isType =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/gif' ||
    file.type === 'image/bmp' ||
    file.type === 'image/jpg'
  if (!isType) {
    message.error('上传图片格式不对!')
    addMaterialLoading.value = false
    return false
  }
  const isLt = file.size / 1024 / 1024 < 2
  if (!isLt) {
    message.error('上传图片大小不能超过 2M!')
    addMaterialLoading.value = false
    return false
  }
  // 校验通过
  return true
}

const handleUploadSuccess = (response, file, fileList) => {
  addMaterialLoading.value = false
  if (response.code !== 0) {
    message.error('上传出错：' + response.msg)
    return false
  }

  // 重置上传文件的表单
  fileList.value = []

  // 设置草稿的封面字段
  articlesAdd.value[isActiveAddNews.value].thumbMediaId = response.data.mediaId
  articlesAdd.value[isActiveAddNews.value].thumbUrl = response.data.url
}

// 选择 or 上传完素材，设置回草稿
const selectMaterial = (item) => {
  dialogImageVisible.value = false
  articlesAdd.value[isActiveAddNews.value].thumbMediaId = item.mediaId
  articlesAdd.value[isActiveAddNews.value].thumbUrl = item.url
}

// 打开素材选择
const openMaterial = () => {
  dialogImageVisible.value = true
  try {
    materialSelectRef.value.queryParams.accountId = queryParams.accountId // 强制设置下 accountId，避免二次查询不对
    materialSelectRef.value.handleQuery() // 刷新列表，失败也无所谓
  } catch (e) {}
}

// ======================== 草稿箱发布 ========================
const handlePublish = async (item) => {
  const accountId = queryParams.accountId
  const mediaId = item.mediaId
  const content =
    '你正在通过发布的方式发表内容。 发布不占用群发次数，一天可多次发布。已发布内容不会推送给用户，也不会展示在公众号主页中。 发布后，你可以前往发表记录获取链接，也可以将发布内容添加到自定义菜单、自动回复、话题和页面模板中。'
  try {
    await message.confirm(content)
    await submitFreePublish(accountId, mediaId)
    getList()
    message.notifySuccess('发布成功')
  } catch {}
}

const handleDelete = async (item) => {
  const accountId = queryParams.accountId
  const mediaId = item.mediaId
  try {
    await message.confirm('此操作将永久删除该草稿, 是否继续?')
    await deleteDraft(accountId, mediaId)
    getList()
    message.notifySuccess('删除成功')
  } catch {}
}
</script>

<style lang="scss" scoped>
.pagination {
  float: right;
  margin-right: 25px;
}

.add_but {
  padding: 10px;
}

.ope-row {
  margin-top: 5px;
  text-align: center;
  border-top: 1px solid #eaeaea;
  padding-top: 5px;
}

.item-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.el-upload__tip {
  margin-left: 5px;
}

/*新增图文*/
.left {
  display: inline-block;
  width: 35%;
  vertical-align: top;
  margin-top: 200px;
}

.right {
  display: inline-block;
  width: 60%;
  margin-top: -40px;
}

.avatar-uploader {
  width: 20%;
  display: inline-block;
}

.avatar-uploader .el-upload {
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-align: unset !important;
}

.avatar-uploader .el-upload:hover {
  border-color: #165dff;
}

.avatar-uploader-icon {
  border: 1px solid #d9d9d9;
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 230px;
  height: 120px;
}

.avatar1 {
  width: 120px;
  height: 120px;
}

.digest {
  width: 60%;
  display: inline-block;
  vertical-align: top;
}

/*新增图文*/
/*瀑布流样式*/
.waterfall {
  width: 100%;
  column-gap: 10px;
  column-count: 5;
  margin: 0 auto;
}

.waterfall-item {
  padding: 10px;
  margin-bottom: 10px;
  break-inside: avoid;
  border: 1px solid #eaeaea;
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
.news-main {
  background-color: #ffffff;
  width: 100%;
  margin: auto;
  height: 120px;
}

.news-content {
  background-color: #acadae;
  width: 100%;
  height: 120px;
  position: relative;
}

.news-content-title {
  display: inline-block;
  font-size: 15px;
  color: #ffffff;
  position: absolute;
  left: 0px;
  bottom: 0px;
  background-color: black;
  width: 98%;
  padding: 1%;
  opacity: 0.65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 25px;
}

.news-main-item {
  background-color: #ffffff;
  padding: 5px 0px;
  border-top: 1px solid #eaeaea;
  width: 100%;
  margin: auto;
}

.news-content-item {
  position: relative;
  margin-left: -3px;
}

.news-content-item-title {
  display: inline-block;
  font-size: 12px;
  width: 70%;
}

.news-content-item-img {
  display: inline-block;
  width: 25%;
  background-color: #acadae;
}

.input-tt {
  padding: 5px;
}

.activeAddNews {
  border: 5px solid #2bb673;
}

.news-main-plus {
  width: 280px;
  text-align: center;
  margin: auto;
  height: 50px;
}

.icon-plus {
  margin: 10px;
  font-size: 25px;
}

.select-item {
  width: 60%;
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;
}

.father .child {
  display: none;
  text-align: center;
  position: relative;
  bottom: 25px;
}

.father:hover .child {
  display: block;
}

.thumb-div {
  display: inline-block;
  width: 30%;
  text-align: center;
}

.thumb-but {
  margin: 5px;
}

.material-img {
  width: 100%;
  height: 100%;
}
</style>
