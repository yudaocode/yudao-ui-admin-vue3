<template>
  <doc-alert title="自动回复" url="https://doc.iocoder.cn/mp/auto-reply/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" :inline="true" label-width="68px">
      <el-form-item label="公众号" prop="accountId">
        <WxMpSelect @change="onAccountChanged" />
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- tab 切换 -->
  <ContentWrap>
    <el-tabs v-model="msgType" @tab-change="handleTabChange">
      <!-- 操作工具栏 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            @click="handleAdd"
            v-hasPermi="['mp:auto-reply:create']"
            v-if="msgType !== MsgType.Follow || list.length <= 0"
          >
            <Icon icon="ep:plus" />新增
          </el-button>
        </el-col>
      </el-row>
      <!-- tab 项 -->
      <el-tab-pane :name="MsgType.Follow">
        <template #label>
          <span><Icon icon="ep:star" /> 关注时回复</span>
        </template>
      </el-tab-pane>
      <el-tab-pane :name="MsgType.Message">
        <template #label>
          <span><Icon icon="ep:chat-line-round" /> 消息回复</span>
        </template>
      </el-tab-pane>
      <el-tab-pane :name="MsgType.Keyword">
        <template #label>
          <span><Icon icon="fa:newspaper-o" /> 关键词回复</span>
        </template>
      </el-tab-pane>
    </el-tabs>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="请求消息类型"
        align="center"
        prop="requestMessageType"
        v-if="msgType === MsgType.Message"
      />
      <el-table-column
        label="关键词"
        align="center"
        prop="requestKeyword"
        v-if="msgType === MsgType.Keyword"
      />
      <el-table-column
        label="匹配类型"
        align="center"
        prop="requestMatch"
        v-if="msgType === MsgType.Keyword"
      >
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH" :value="scope.row.requestMatch" />
        </template>
      </el-table-column>
      <el-table-column label="回复消息类型" align="center">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MP_MESSAGE_TYPE" :value="scope.row.responseMessageType" />
        </template>
      </el-table-column>
      <el-table-column label="回复内容" align="center">
        <template #default="scope">
          <div v-if="scope.row.responseMessageType === 'text'">{{ scope.row.responseContent }}</div>
          <div v-else-if="scope.row.responseMessageType === 'voice'">
            <WxVoicePlayer v-if="scope.row.responseMediaUrl" :url="scope.row.responseMediaUrl" />
          </div>
          <div v-else-if="scope.row.responseMessageType === 'image'">
            <a target="_blank" :href="scope.row.responseMediaUrl">
              <img :src="scope.row.responseMediaUrl" style="width: 100px" />
            </a>
          </div>
          <div
            v-else-if="
              scope.row.responseMessageType === 'video' ||
              scope.row.responseMessageType === 'shortvideo'
            "
          >
            <WxVideoPlayer
              v-if="scope.row.responseMediaUrl"
              :url="scope.row.responseMediaUrl"
              style="margin-top: 10px"
            />
          </div>
          <div v-else-if="scope.row.responseMessageType === 'news'">
            <WxNews :articles="scope.row.responseArticles" />
          </div>
          <div v-else-if="scope.row.responseMessageType === 'music'">
            <WxMusic
              :title="scope.row.responseTitle"
              :description="scope.row.responseDescription"
              :thumb-media-url="scope.row.responseThumbMediaUrl"
              :music-url="scope.row.responseMusicUrl"
              :hq-music-url="scope.row.responseHqMusicUrl"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            type="primary"
            link
            @click="handleUpdate(scope.row)"
            v-hasPermi="['mp:auto-reply:update']"
          >
            修改
          </el-button>
          <el-button
            type="danger"
            link
            @click="handleDelete(scope.row)"
            v-hasPermi="['mp:auto-reply:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改自动回复的对话框 -->
    <el-dialog :title="title" v-model="showReplyFormDialog" width="800px" append-to-body>
      <el-form ref="formRef" :model="replyForm" :rules="rules" label-width="80px">
        <el-form-item label="消息类型" prop="requestMessageType" v-if="msgType === MsgType.Message">
          <el-select v-model="replyForm.requestMessageType" placeholder="请选择">
            <template v-for="dict in getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE)" :key="dict.value">
              <el-option
                v-if="RequestMessageTypes.includes(dict.value)"
                :label="dict.label"
                :value="dict.value"
              />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="匹配类型" prop="requestMatch" v-if="msgType === MsgType.Keyword">
          <el-select v-model="replyForm.requestMatch" placeholder="请选择匹配类型" clearable>
            <el-option
              v-for="dict in getDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词" prop="requestKeyword" v-if="msgType === MsgType.Keyword">
          <el-input v-model="replyForm.requestKeyword" placeholder="请输入内容" clearable />
        </el-form-item>
        <el-form-item label="回复消息">
          <WxReplySelect :objData="objData" v-if="hackResetWxReplySelect" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>
<script setup lang="ts" name="MpAutoReply">
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxMusic from '@/views/mp/components/wx-music/main.vue'
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxReplySelect from '@/views/mp/components/wx-reply/main.vue'
import WxMpSelect from '@/views/mp/components/WxMpSelect.vue'
import * as MpAutoReplyApi from '@/api/mp/autoReply'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { ContentWrap } from '@/components/ContentWrap'
import type { TabPaneName } from 'element-plus'

const message = useMessage()

const formRef = ref()

// 消息类型（Follow: 关注时回复；Message: 消息回复；Keyword: 关键词回复）
// 作为tab.name
enum MsgType {
  Follow = 1,
  Message = 2,
  Keyword = 3
}
const msgType = ref<MsgType>(MsgType.Keyword)
// 允许选择的请求消息类型
const RequestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link']
// 遮罩层
const loading = ref(true)
// 总条数
const total = ref(0)
// 自动回复列表
const list = ref<any[]>([])

// 查询参数
interface QueryParams {
  pageNo: number
  pageSize: number
  accountId?: number
}
const queryParams: QueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: undefined
})

// 弹出层标题
const title = ref('')
// 是否显示弹出层
const showReplyFormDialog = ref(false)
// 表单参数
type ReplyType = 'text' | 'image' | 'voice' | 'video' | 'shortvideo' | 'location' | 'link'
interface ReplyForm {
  // relation:
  id?: number
  accountId?: number
  type?: MsgType
  // request:
  requestMessageType?: ReplyType
  requestMatch?: number
  requestKeyword?: string
  // response:
  responseMessageType?: ReplyType
  responseContent?: string
  responseMediaId?: number
  responseMediaUrl?: string
  responseTitle?: string
  responseDescription?: number
  responseThumbMediaId?: string
  responseThumbMediaUrl?: string
  responseArticles?: any[]
  responseMusicUrl?: string
  responseHqMusicUrl?: string
}
interface ObjData {
  type: ReplyType
  accountId?: number
  content?: string
  mediaId?: number
  url?: string
  title?: string
  description?: string
  thumbMediaId?: number
  thumbMediaUrl?: string
  articles?: any[]
  musicUrl?: string
  hqMusicUrl?: string
}
const replyForm = ref<ReplyForm>({})
// 回复消息
const objData = ref<ObjData>({
  type: 'text',
  accountId: undefined
})
// 表单校验
const rules = {
  requestKeyword: [{ required: true, message: '请求的关键字不能为空', trigger: 'blur' }],
  requestMatch: [{ required: true, message: '请求的关键字的匹配不能为空', trigger: 'blur' }]
}

// 重置 WxReplySelect 组件，解决无法清除的问题
const hackResetWxReplySelect = ref(false)

const onAccountChanged = (id?: number) => {
  queryParams.accountId = id
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = false
  try {
    const data = await MpAutoReplyApi.getAutoReplyPage({
      ...queryParams,
      type: msgType.value
    })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const handleTabChange = (tabName: TabPaneName) => {
  msgType.value = tabName as MsgType
  handleQuery()
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  resetEditor()
  // 打开表单，并设置初始化
  objData.value = {
    type: 'text',
    accountId: queryParams.accountId
  }

  title.value = '新增自动回复'
  showReplyFormDialog.value = true
}

/** 修改按钮操作 */
const handleUpdate = async (row: any) => {
  reset()
  resetEditor()

  const data = await MpAutoReplyApi.getAutoReply(row.id)
  // 设置属性
  replyForm.value = { ...data }
  delete replyForm.value['responseMessageType']
  delete replyForm.value['responseContent']
  delete replyForm.value['responseMediaId']
  delete replyForm.value['responseMediaUrl']
  delete replyForm.value['responseDescription']
  delete replyForm.value['responseArticles']
  objData.value = {
    type: data.responseMessageType,
    accountId: queryParams.accountId,
    content: data.responseContent,
    mediaId: data.responseMediaId,
    url: data.responseMediaUrl,
    title: data.responseTitle,
    description: data.responseDescription,
    thumbMediaId: data.responseThumbMediaId,
    thumbMediaUrl: data.responseThumbMediaUrl,
    articles: data.responseArticles,
    musicUrl: data.responseMusicUrl,
    hqMusicUrl: data.responseHqMusicUrl
  }

  // 打开表单
  title.value = '修改自动回复'
  showReplyFormDialog.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  // 处理回复消息
  const submitForm: any = { ...replyForm.value }
  submitForm.responseMessageType = objData.value.type
  submitForm.responseContent = objData.value.content
  submitForm.responseMediaId = objData.value.mediaId
  submitForm.responseMediaUrl = objData.value.url
  submitForm.responseTitle = objData.value.title
  submitForm.responseDescription = objData.value.description
  submitForm.responseThumbMediaId = objData.value.thumbMediaId
  submitForm.responseThumbMediaUrl = objData.value.thumbMediaUrl
  submitForm.responseArticles = objData.value.articles
  submitForm.responseMusicUrl = objData.value.musicUrl
  submitForm.responseHqMusicUrl = objData.value.hqMusicUrl

  if (replyForm.value.id !== undefined) {
    await MpAutoReplyApi.updateAutoReply(submitForm)
    message.success('修改成功')
  } else {
    await MpAutoReplyApi.createAutoReply(submitForm)
    message.success('新增成功')
  }

  showReplyFormDialog.value = false
  getList()
}

// 表单重置
const reset = () => {
  replyForm.value = {
    id: undefined,
    accountId: queryParams.accountId,
    type: msgType.value,
    requestKeyword: undefined,
    requestMatch: msgType.value === MsgType.Keyword ? 1 : undefined,
    requestMessageType: undefined
  }
  formRef.value?.resetFields()
}

// 取消按钮
const cancel = () => {
  showReplyFormDialog.value = false
  reset()
}

// 表单 Editor 重置
const resetEditor = () => {
  hackResetWxReplySelect.value = false // 销毁组件
  nextTick(() => {
    hackResetWxReplySelect.value = true // 重建组件
  })
}

const handleDelete = async (row) => {
  await message.confirm('是否确认删除此数据?')
  await MpAutoReplyApi.deleteAutoReply(row.id)
  await getList()
  message.success('删除成功')
}
</script>
