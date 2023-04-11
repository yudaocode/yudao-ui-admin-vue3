<template>
  <doc-alert title="自动回复" url="https://doc.iocoder.cn/mp/auto-reply/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <!-- TODO @芋艿：调整成 el-form 和 WxAccountSelect  -->
    <WxAccountSelect @change="accountChanged" />
  </ContentWrap>

  <!-- tab 切换 -->
  <ContentWrap>
    <el-tabs v-model="type" @tab-change="handleTabChange">
      <!-- 操作工具栏 -->
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            @click="handleAdd"
            v-hasPermi="['mp:auto-reply:create']"
            v-if="type !== '1' || list.length <= 0"
          >
            <Icon icon="ep:plus" />新增
          </el-button>
        </el-col>
      </el-row>
      <!-- tab 项 -->
      <el-tab-pane name="1">
        <template #label>
          <span><Icon icon="ep:star-off" /> 关注时回复</span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="2">
        <template #label>
          <span><Icon icon="ep:chat-line-round" /> 消息回复</span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="3">
        <template #label>
          <span><Icon icon="ep:news" /> 关键词回复</span>
        </template>
      </el-tab-pane>
    </el-tabs>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="请求消息类型"
        align="center"
        prop="requestMessageType"
        v-if="type === '2'"
      />
      <el-table-column label="关键词" align="center" prop="requestKeyword" v-if="type === '3'" />
      <el-table-column label="匹配类型" align="center" prop="requestMatch" v-if="type === '3'">
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
            <WxVoicePlayer :url="scope.row.responseMediaUrl" />
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
            <WxVideoPlayer :url="scope.row.responseMediaUrl" style="margin-top: 10px" />
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
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="消息类型" prop="requestMessageType" v-if="type === '2'">
          <el-select v-model="form.requestMessageType" placeholder="请选择">
            <template v-for="dict in getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE)" :key="dict.value">
              <el-option
                v-if="requestMessageTypes.includes(dict.value)"
                :label="dict.label"
                :value="dict.value"
              />
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="匹配类型" prop="requestMatch" v-if="type === '3'">
          <el-select v-model="form.requestMatch" placeholder="请选择匹配类型" clearable>
            <el-option
              v-for="dict in getDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词" prop="requestKeyword" v-if="type === '3'">
          <el-input v-model="form.requestKeyword" placeholder="请输入内容" clearable />
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
<script setup name="MpAutoReply">
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxMusic from '@/views/mp/components/wx-music/main.vue'
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxReplySelect from '@/views/mp/components/wx-reply/main.vue'
import WxAccountSelect from '@/views/mp/components/wx-account-select/main.vue'
import * as MpAutoReplyApi from '@/api/mp/autoReply'

import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { ContentWrap } from '@/components/ContentWrap'

const message = useMessage()

// const queryFormRef = ref()
const formRef = ref()

// tab 类型（1、关注时回复；2、消息回复；3、关键词回复）
const type = ref('3')
// 允许选择的请求消息类型
const requestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link']
// 遮罩层
const loading = ref(true)
// 显示搜索条件
// const showSearch = ref(true)
// 总条数
const total = ref(0)
// 自动回复列表
const list = ref([])
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: undefined
})

// 弹出层标题
const title = ref('')
// 是否显示弹出层
const open = ref(false)
// 表单参数
const form = ref({})
// 回复消息
const objData = ref({
  type: 'text'
})
// 表单校验
const rules = {
  requestKeyword: [{ required: true, message: '请求的关键字不能为空', trigger: 'blur' }],
  requestMatch: [{ required: true, message: '请求的关键字的匹配不能为空', trigger: 'blur' }]
}

// 重置 WxReplySelect 组件，解决无法清除的问题
const hackResetWxReplySelect = ref(false)

const accountChanged = (accountId) => {
  queryParams.accountId = accountId
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = false
  try {
    const data = await MpAutoReplyApi.getAutoReplyPage({
      ...queryParams,
      type: type.value
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

const handleTabChange = (tabName) => {
  type.value = tabName
  handleQuery()
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  resetEditor()
  // 打开表单，并设置初始化
  open.value = true
  title.value = '新增自动回复'
  objData.value = {
    type: 'text',
    accountId: queryParams.accountId
  }
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  resetEditor()
  console.log(row)

  MpAutoReplyApi.getAutoReply(row.id).then((data) => {
    // 设置属性
    form.value = { ...data }
    delete form.value['responseMessageType']
    delete form.value['responseContent']
    delete form.value['responseMediaId']
    delete form.value['responseMediaUrl']
    delete form.value['responseDescription']
    delete form.value['responseArticles']
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
    open.value = true
    title.value = '修改自动回复'
  })
}

const handleSubmit = () => {
  formRef.value?.validate((valid) => {
    if (!valid) {
      return
    }

    // 处理回复消息
    const form = { ...form.value }
    form.responseMessageType = objData.value.type
    form.responseContent = objData.value.content
    form.responseMediaId = objData.value.mediaId
    form.responseMediaUrl = objData.value.url
    form.responseTitle = objData.value.title
    form.responseDescription = objData.value.description
    form.responseThumbMediaId = objData.value.thumbMediaId
    form.responseThumbMediaUrl = objData.value.thumbMediaUrl
    form.responseArticles = objData.value.articles
    form.responseMusicUrl = objData.value.musicUrl
    form.responseHqMusicUrl = objData.value.hqMusicUrl

    if (form.value.id !== undefined) {
      MpAutoReplyApi.updateAutoReply(form).then(() => {
        message.success('修改成功')
        open.value = false
        getList()
      })
    } else {
      MpAutoReplyApi.createAutoReply(form).then(() => {
        message.success('新增成功')
        open.value = false
        getList()
      })
    }
  })
}

// 表单重置
const reset = () => {
  form.value = {
    id: undefined,
    accountId: queryParams.accountId,
    type: type.value,
    requestKeyword: undefined,
    requestMatch: type.value === '3' ? 1 : undefined,
    requestMessageType: undefined
  }
  formRef.value?.resetFields()
}

// 取消按钮
const cancel = () => {
  open.value = false
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
