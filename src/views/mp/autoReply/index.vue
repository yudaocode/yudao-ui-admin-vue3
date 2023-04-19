<template>
  <doc-alert title="自动回复" url="https://doc.iocoder.cn/mp/auto-reply/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form class="-mb-15px" :model="queryParams" :inline="true" label-width="68px">
      <el-form-item label="公众号" prop="accountId">
        <WxAccountSelect @change="onAccountChanged" />
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- tab 切换 -->
  <ContentWrap>
    <el-tabs v-model="msgType" @tab-change="onTabChange">
      <!-- 操作工具栏 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            @click="onCreate"
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
          <el-row align="middle"><Icon icon="ep:star" class="mr-2px" /> 关注时回复</el-row>
        </template>
      </el-tab-pane>
      <el-tab-pane :name="MsgType.Message">
        <template #label>
          <el-row align="middle"><Icon icon="ep:chat-line-round" class="mr-2px" /> 消息回复</el-row>
        </template>
      </el-tab-pane>
      <el-tab-pane :name="MsgType.Keyword">
        <template #label>
          <el-row align="middle"><Icon icon="fa:newspaper-o" class="mr-2px" /> 关键词回复</el-row>
        </template>
      </el-tab-pane>
    </el-tabs>
    <!-- 列表 -->
    <ReplyTable
      :loading="loading"
      :list="list"
      :msg-type="msgType"
      @on-update="onUpdate"
      @on-delete="onDelete"
    />

    <!-- 添加或修改自动回复的对话框 -->
    <!-- TODO @Dhb52 -->
    <el-dialog :title="dialogTitle" v-model="showFormDialog" width="800px" destroy-on-close>
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
              v-for="dict in getIntDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH)"
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
          <WxReplySelect :objData="objData" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="onSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>
<script setup lang="ts" name="MpAutoReply">
import WxReplySelect from '@/views/mp/components/wx-reply/main.vue'
import WxAccountSelect from '@/views/mp/components/wx-account-select/main.vue'
import * as MpAutoReplyApi from '@/api/mp/autoReply'
import { DICT_TYPE, getDictOptions, getIntDictOptions } from '@/utils/dict'
import { ContentWrap } from '@/components/ContentWrap'
import type { TabPaneName } from 'element-plus'
import ReplyTable from './components/ReplyTable.vue'
import { MsgType, ReplyForm, ObjData } from './components/types'
const message = useMessage() // 消息

const msgType = ref<MsgType>(MsgType.Keyword) // 消息类型
const RequestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link'] // 允许选择的请求消息类型
const loading = ref(true) // 遮罩层
const total = ref(0) // 总条数
const list = ref<any[]>([]) // 自动回复列表
const formRef = ref() // 表单 ref
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

const dialogTitle = ref('') // 弹出层标题
const showFormDialog = ref(false) // 是否显示弹出层
const replyForm = ref<ReplyForm>({}) // 表单参数
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

/** 侦听账号变化 */
const onAccountChanged = (id?: number) => {
  queryParams.accountId = id
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
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

const onTabChange = (tabName: TabPaneName) => {
  msgType.value = tabName as MsgType
  handleQuery()
}

/** 新增按钮操作 */
const onCreate = () => {
  reset()
  // 打开表单，并设置初始化
  objData.value = {
    type: 'text',
    accountId: queryParams.accountId
  }

  dialogTitle.value = '新增自动回复'
  showFormDialog.value = true
}

/** 修改按钮操作 */
const onUpdate = async (id: number) => {
  reset()

  const data = await MpAutoReplyApi.getAutoReply(id)
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
  dialogTitle.value = '修改自动回复'
  showFormDialog.value = true
}

/** 删除按钮操作 */
const onDelete = async (id: number) => {
  await message.confirm('是否确认删除此数据?')
  await MpAutoReplyApi.deleteAutoReply(id)
  await getList()
  message.success('删除成功')
}

const onSubmit = async () => {
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

  showFormDialog.value = false
  await getList()
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
  showFormDialog.value = false
  reset()
}
</script>
