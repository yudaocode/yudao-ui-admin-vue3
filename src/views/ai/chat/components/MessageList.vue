
<template>
  <div class="message-container" ref="messageContainer">
    <div class="chat-list" v-for="(item, index) in list" :key="index">
      <!--  靠左 message  -->
      <div class="left-message message-item" v-if="item.type === 'system'">
        <div class="avatar" >
          <el-avatar
            src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
          />
        </div>
        <div class="message">
          <div>
            <el-text class="time">{{formatDate(item.createTime)}}</el-text>
          </div>
          <div class="left-text-container">
            <el-text class="left-text">
              {{item.content}}
            </el-text>
          </div>
          <div class="left-btns">
            <div class="btn-cus" @click="noCopy(item.content)">
              <img class="btn-image" src="@/assets/ai/copy.svg"/>
              <el-text class="btn-cus-text">复制</el-text>
            </div>
            <div class="btn-cus" style="margin-left: 20px;" @click="onDelete(item.id)">
              <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px;"/>
              <el-text class="btn-cus-text">删除</el-text>
            </div>
          </div>
        </div>
      </div>
      <!--  靠右 message  -->
      <div class="right-message message-item" v-if="item.type === 'user'">
        <div class="avatar">
          <el-avatar
            src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
          />
        </div>
        <div class="message">
          <div>
            <el-text class="time">{{formatDate(item.createTime)}}</el-text>
          </div>
          <div class="right-text-container">
            <el-text class="right-text">
              {{item.content}}
            </el-text>
          </div>
          <div class="right-btns">
            <div class="btn-cus"  @click="noCopy(item.content)">
              <img class="btn-image" src="@/assets/ai/copy.svg"/>
              <el-text class="btn-cus-text">复制</el-text>
            </div>
            <div class="btn-cus" style="margin-left: 20px;" @click="onDelete(item.id)">
              <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px;"/>
              <el-text class="btn-cus-text">删除</el-text>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import {ChatMessageApi, ChatMessageVO, ChatMessageSendVO} from '@/api/ai/chat/message'
import { formatDate } from '@/utils/formatTime'
import {ApiKeyVO} from "@/api/ai/model/apiKey";

// 初始化 copy 到粘贴板
const { copy, isSupported } = useClipboard();
/** chat message 列表 */
defineOptions({ name: 'chatMessageList' })
const list = ref<ChatMessageVO[]>([]) // 列表的数据

// 对话id TODO @范 先写死
const conversationId = '1781604279872581648'
const content = '苹果是什么颜色？'

/** 查询列表 */
const messageList = async () => {
  try {
    // 获取列表数据
    const res = await ChatMessageApi.messageList(conversationId)
    list.value = res;
    // 滚动到最下面
    scrollToBottom();
  } finally {
  }
}
// ref
const messageContainer: any = ref(null);
const isScrolling = ref(false)//用于判断用户是否在滚动

/** send */
const sendMessage = async () => {
  try {
    const requestParams = {
      conversationId,
      content,
    }
    const messageSendVO = requestParams as unknown as ChatMessageSendVO
    const res = await ChatMessageApi.send(messageSendVO) as unknown as ChatMessageVO
    console.log('---', res.content)
  } finally {
  }
}

function scrollToBottom() {
  nextTick(() => {
    //注意要使用nexttick以免获取不到dom
    console.log('isScrolling.value', isScrolling.value)
    if (!isScrolling.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight - messageContainer.value.offsetHeight
    }
  })
}

function handleScroll() {
  const scrollContainer = messageContainer.value
  const scrollTop = scrollContainer.scrollTop
  const scrollHeight = scrollContainer.scrollHeight
  const offsetHeight = scrollContainer.offsetHeight

  if (scrollTop + offsetHeight < scrollHeight) {
    // 用户开始滚动并在最底部之上，取消保持在最底部的效果
    isScrolling.value = true
  } else {
    // 用户停止滚动并滚动到最底部，开启保持到最底部的效果
    isScrolling.value = false
  }
}

function noCopy(content) {
  copy(content)
  ElMessage({
    message: '复制成功!',
    type: 'success',
  })
}

const onDelete = async (id) => {
  // 删除 message
  await ChatMessageApi.delete(id)
  ElMessage({
    message: '删除成功!',
    type: 'success',
  })
  // 重新获取 message 列表
  await messageList();
}

/** 初始化 **/
onMounted(async () => {
  // 获取列表数据
  messageList();

  // scrollToBottom();
  // await nextTick
  // 监听滚动事件，判断用户滚动状态
  messageContainer.value.addEventListener('scroll', handleScroll)

})
</script>

<style scoped lang="scss">

.message-container {
  position: absolute;
  top: 0;
  bottom: 0;
  overflow-y: scroll;
  padding: 0 15px;
}

// 中间
.chat-list {
  display: flex;
  flex-direction: column;
  overflow-y: hidden;

  .message-item {
    margin-top: 50px;
  }

  .left-message {
    display: flex;
    flex-direction: row;
  }

  .right-message {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .avatar {
    //height: 170px;
    //width: 170px;
  }

  .message {
    display: flex;
    flex-direction: column;
    text-align: left;
    margin: 0 15px;

    .time {
      text-align: left;
      line-height: 30px;
    }

    .left-text-container {
      display: flex;
      flex-direction: column;
      overflow-wrap: break-word;
      background-color: #e4e4e4;
      box-shadow: 0 0 0 1px #e4e4e4;
      border-radius: 10px;
      padding: 10px 10px 5px 10px;

      .left-text {
        color: #393939;
      }
    }

    .right-text-container {
      display: flex;
      flex-direction: column;
      overflow-wrap: break-word;
      background-color: #267fff;
      color: #FFF;
      box-shadow: 0 0 0 1px #267fff;
      border-radius: 10px;
      padding: 10px;

      .right-text {
        color: #FFF;
      }
    }

    .left-btns, .right-btns {
      display: flex;
      flex-direction: row;
      margin-top: 8px;
    }
  }

  // 复制、删除按钮
  .btn-cus {
    display: flex;
    background-color: transparent;
    align-items: center;

    .btn-image {
      height: 20px;
      margin-right: 5px;
    }

    .btn-cus-text {
      color: #757575;
    }
  }

  .btn-cus:hover {
    cursor: pointer;
  }

  .btn-cus:focus {
    background-color: #8c939d;
  }
}

</style>
