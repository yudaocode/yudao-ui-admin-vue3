<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="公众号" prop="accountId">
        <WxMpSelect @change="onAccountChanged" />
      </el-form-item>
      <el-form-item label="消息类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择消息类型" class="!w-240px">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户标识" prop="openid">
        <el-input
          v-model="queryParams.openid"
          placeholder="请输入用户标识"
          clearable
          :v-on="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="发送时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="消息类型" align="center" prop="type" width="80" />
      <el-table-column label="发送方" align="center" prop="sendFrom" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.sendFrom === 1" type="success">粉丝</el-tag>
          <el-tag v-else type="info">公众号</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="用户标识" align="center" prop="openid" width="300" />
      <el-table-column label="内容" prop="content">
        <template #default="scope">
          <!-- 【事件】区域 -->
          <div v-if="scope.row.type === MsgType.Event && scope.row.event === 'subscribe'">
            <el-tag type="success">关注</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'unsubscribe'">
            <el-tag type="danger">取消关注</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'CLICK'">
            <el-tag>点击菜单</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'VIEW'">
            <el-tag>点击菜单链接</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div
            v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'scancode_waitmsg'"
          >
            <el-tag>扫码结果</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'scancode_push'">
            <el-tag>扫码结果</el-tag>
            【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'pic_sysphoto'">
            <el-tag>系统拍照发图</el-tag>
          </div>
          <div
            v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'pic_photo_or_album'"
          >
            <el-tag>拍照或者相册</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'pic_weixin'">
            <el-tag>微信相册</el-tag>
          </div>
          <div
            v-else-if="scope.row.type === MsgType.Event && scope.row.event === 'location_select'"
          >
            <el-tag>选择地理位置</el-tag>
          </div>
          <div v-else-if="scope.row.type === MsgType.Event">
            <el-tag type="danger">未知事件类型</el-tag>
          </div>
          <!-- 【消息】区域 -->
          <div v-else-if="scope.row.type === MsgType.Text">{{ scope.row.content }}</div>
          <div v-else-if="scope.row.type === MsgType.Voice">
            <wx-voice-player :url="scope.row.mediaUrl" :content="scope.row.recognition" />
          </div>
          <div v-else-if="scope.row.type === MsgType.Image">
            <a target="_blank" :href="scope.row.mediaUrl">
              <img :src="scope.row.mediaUrl" style="width: 100px" />
            </a>
          </div>
          <div v-else-if="scope.row.type === MsgType.Video || scope.row.type === 'shortvideo'">
            <wx-video-player :url="scope.row.mediaUrl" style="margin-top: 10px" />
          </div>
          <div v-else-if="scope.row.type === MsgType.Link">
            <el-tag>链接</el-tag>
            ：
            <a :href="scope.row.url" target="_blank">{{ scope.row.title }}</a>
          </div>
          <div v-else-if="scope.row.type === MsgType.Location">
            <WxLocation
              :label="scope.row.label"
              :location-y="scope.row.locationY"
              :location-x="scope.row.locationX"
            />
          </div>
          <div v-else-if="scope.row.type === MsgType.Music">
            <WxMusic
              :title="scope.row.title"
              :description="scope.row.description"
              :thumb-media-url="scope.row.thumbMediaUrl"
              :music-url="scope.row.musicUrl"
              :hq-music-url="scope.row.hqMusicUrl"
            />
          </div>
          <div v-else-if="scope.row.type === MsgType.News">
            <WxNews :articles="scope.row.articles" />
          </div>
          <div v-else>
            <el-tag type="danger">未知消息类型</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleSend(scope.row)"
            v-hasPermi="['mp:message:send']"
          >
            消息
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <Pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 发送消息的弹窗 -->
    <el-dialog
      title="粉丝消息列表"
      v-model="showMessageBox"
      @click="showMessageBox = true"
      width="50%"
      destroy-on-close
    >
      <WxMsg :user-id="userId" />
    </el-dialog>
  </ContentWrap>
</template>
<script setup lang="ts" name="MpMessage">
import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import WxMsg from '@/views/mp/components/wx-msg/main.vue'
import WxLocation from '@/views/mp/components/wx-location/main.vue'
import WxMusic from '@/views/mp/components/wx-music/main.vue'
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxMpSelect from '@/views/mp/components/WxMpSelect.vue'
import * as MpMessageApi from '@/api/mp/message'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { MsgType } from '@/views/mp/components/wx-msg/types'
import type { FormInstance } from 'element-plus'

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据

// 搜索参数
interface QueryParams {
  pageNo: number
  pageSize: number
  openid: string | null
  accountId: number | null
  type: MsgType | null
  createTime: string[] | []
}
const queryParams: QueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  openid: null,
  accountId: null,
  type: null,
  createTime: []
})
const queryFormRef = ref<FormInstance | null>(null) // 搜索的表单
const showMessageBox = ref(false) // 是否显示弹出层
const userId = ref(0) // 操作的用户编号

/** 侦听accountId */
const onAccountChanged = (id?: number) => {
  queryParams.accountId = id as number
  handleQuery()
}

/** 查询列表 */
const getList = async () => {
  try {
    loading.value = true
    const data = await MpMessageApi.getMessagePage(queryParams)
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

/** 重置按钮操作 */
const resetQuery = async () => {
  // 暂存accountId，并在reset后恢复
  const accountId = queryParams.accountId
  queryFormRef.value?.resetFields()
  queryParams.accountId = accountId
  handleQuery()
}

/** 打开消息发送窗口 */
const handleSend = async (row: any) => {
  userId.value = row.userId
  showMessageBox.value = true
}
</script>
