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
        <el-select v-model="queryParams.accountId" placeholder="请选择公众号" class="!w-240px">
          <el-option
            v-for="item in accountList"
            :key="parseInt(item.id)"
            :label="item.name"
            :value="parseInt(item.id)"
          />
        </el-select>
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
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="发送时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
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
          <div v-if="scope.row.type === 'event' && scope.row.event === 'subscribe'">
            <el-tag type="success">关注</el-tag>
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'unsubscribe'">
            <el-tag type="danger">取消关注</el-tag>
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'CLICK'">
            <el-tag>点击菜单</el-tag>【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'VIEW'">
            <el-tag>点击菜单链接</el-tag>【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'scancode_waitmsg'">
            <el-tag>扫码结果</el-tag>【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'scancode_push'">
            <el-tag>扫码结果</el-tag>【{{ scope.row.eventKey }}】
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'pic_sysphoto'">
            <el-tag>系统拍照发图</el-tag>
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'pic_photo_or_album'">
            <el-tag>拍照或者相册</el-tag>
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'pic_weixin'">
            <el-tag>微信相册</el-tag>
          </div>
          <div v-else-if="scope.row.type === 'event' && scope.row.event === 'location_select'">
            <el-tag>选择地理位置</el-tag>
          </div>
          <div v-else-if="scope.row.type === 'event'">
            <el-tag type="danger">未知事件类型</el-tag>
          </div>
          <!-- 【消息】区域 -->
          <div v-else-if="scope.row.type === 'text'">{{ scope.row.content }}</div>
          <div v-else-if="scope.row.type === 'voice'">
            <wx-voice-player :url="scope.row.mediaUrl" :content="scope.row.recognition" />
          </div>
          <div v-else-if="scope.row.type === 'image'">
            <a target="_blank" :href="scope.row.mediaUrl">
              <img :src="scope.row.mediaUrl" style="width: 100px" />
            </a>
          </div>
          <div v-else-if="scope.row.type === 'video' || scope.row.type === 'shortvideo'">
            <wx-video-player :url="scope.row.mediaUrl" style="margin-top: 10px" />
          </div>
          <div v-else-if="scope.row.type === 'link'">
            <el-tag>链接</el-tag>：
            <a :href="scope.row.url" target="_blank">{{ scope.row.title }}</a>
          </div>
          <div v-else-if="scope.row.type === 'location'">
            <wx-location
              :label="scope.row.label"
              :location-y="scope.row.locationY"
              :location-x="scope.row.locationX"
            />
          </div>
          <div v-else-if="scope.row.type === 'music'">
            <wx-music
              :title="scope.row.title"
              :description="scope.row.description"
              :thumb-media-url="scope.row.thumbMediaUrl"
              :music-url="scope.row.musicUrl"
              :hq-music-url="scope.row.hqMusicUrl"
            />
          </div>
          <div v-else-if="scope.row.type === 'news'">
            <wx-news :articles="scope.row.articles" />
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
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 发送消息的弹窗 -->
    <el-dialog title="粉丝消息列表" v-model:visible="open" width="50%">
      <wx-msg :user-id="userId" v-if="open" />
    </el-dialog>
  </ContentWrap>
</template>
<script setup lang="ts" name="MpMessage">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
// import WxVideoPlayer from '@/views/mp/components/wx-video-play/main.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
// import WxMsg from '@/views/mp/components/wx-msg/main.vue'
import WxLocation from '@/views/mp/components/wx-location/main.vue'
// import WxMusic from '@/views/mp/components/wx-music/main.vue'
// import WxNews from '@/views/mp/components/wx-news/main.vue'
import { parseTime } from '@/utils/formatTime'
import * as MpAccountApi from '@/api/mp/account'
import * as MpMessageApi from '@/api/mp/message'
const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  openid: null,
  accountId: null,
  type: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
// TODO 芋艿：下面应该移除
const open = ref(false) // 是否显示弹出层
const userId = ref(0) // 操作的用户编号
const accountList = ref<MpAccountApi.AccountVO[]>([]) // 公众号账号列表

/** 查询参数列表 */
const getList = async () => {
  // 如果没有选中公众号账号，则进行提示。
  if (!queryParams.accountId) {
    await message.error('未选中公众号，无法查询消息')
    return
  }
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
  queryFormRef.value.resetFields()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    // @ts-ignore
    queryParams.accountId = accountList.value[0].id
  }
  handleQuery()
}
const handleSend = async (row) => {
  userId.value = row.userId
  open.value = true
}

/** 初始化 **/
onMounted(async () => {
  accountList.value = await MpAccountApi.getSimpleAccountList()
  // 选中第一个
  if (accountList.value.length > 0) {
    // @ts-ignore
    queryParams.accountId = accountList.value[0].id
  }
  await getList()
})
</script>
