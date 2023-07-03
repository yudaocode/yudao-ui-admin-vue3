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

    <el-dialog
      :title="isCreating ? '新增自动回复' : '修改自动回复'"
      v-model="showDialog"
      width="800px"
      destroy-on-close
    >
      <ReplyForm v-model="replyForm" v-model:reply="reply" :msg-type="msgType" ref="formRef" />
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="onSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>
<script lang="ts" setup>
import ReplyForm from '@/views/mp/autoReply/components/ReplyForm.vue'
import { type Reply, ReplyType } from '@/views/mp/components/wx-reply'
import WxAccountSelect from '@/views/mp/components/wx-account-select'
import * as MpAutoReplyApi from '@/api/mp/autoReply'
import { ContentWrap } from '@/components/ContentWrap'
import type { TabPaneName } from 'element-plus'
import ReplyTable from './components/ReplyTable.vue'
import { MsgType } from './components/types'

defineOptions({ name: 'MpAutoReply' })

const message = useMessage() // 消息

const accountId = ref(-1) // 公众号ID
const msgType = ref<MsgType>(MsgType.Keyword) // 消息类型
const loading = ref(true) // 遮罩层
const total = ref(0) // 总条数
const list = ref<any[]>([]) // 自动回复列表
const formRef = ref<InstanceType<typeof ReplyForm> | null>(null) // 表单 ref
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: accountId
})

const isCreating = ref(false) // 是否新建（否则编辑）
const showDialog = ref(false) // 是否显示弹出层
const replyForm = ref<any>({}) // 表单参数
// 回复消息
const reply = ref<Reply>({
  type: ReplyType.Text,
  accountId: -1
})

/** 侦听账号变化 */
const onAccountChanged = (id: number) => {
  accountId.value = id
  reply.value.accountId = id
  queryParams.pageNo = 1
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
  reply.value = {
    type: ReplyType.Text,
    accountId: queryParams.accountId
  }

  isCreating.value = true
  showDialog.value = true
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
  reply.value = {
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
  isCreating.value = false
  showDialog.value = true
}

/** 删除按钮操作 */
const onDelete = async (id: number) => {
  await message.confirm('是否确认删除此数据?')
  await MpAutoReplyApi.deleteAutoReply(id)
  await getList()
  message.success('删除成功')
}

const onSubmit = async () => {
  await formRef.value?.validate()

  // 处理回复消息
  const submitForm: any = { ...replyForm.value }
  submitForm.responseMessageType = reply.value.type
  submitForm.responseContent = reply.value.content
  submitForm.responseMediaId = reply.value.mediaId
  submitForm.responseMediaUrl = reply.value.url
  submitForm.responseTitle = reply.value.title
  submitForm.responseDescription = reply.value.description
  submitForm.responseThumbMediaId = reply.value.thumbMediaId
  submitForm.responseThumbMediaUrl = reply.value.thumbMediaUrl
  submitForm.responseArticles = reply.value.articles
  submitForm.responseMusicUrl = reply.value.musicUrl
  submitForm.responseHqMusicUrl = reply.value.hqMusicUrl

  if (replyForm.value.id !== undefined) {
    await MpAutoReplyApi.updateAutoReply(submitForm)
    message.success('修改成功')
  } else {
    await MpAutoReplyApi.createAutoReply(submitForm)
    message.success('新增成功')
  }

  showDialog.value = false
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
  showDialog.value = false
  reset()
}
</script>
