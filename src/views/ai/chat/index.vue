<template>
  <el-container class="ai-layout">
    <!-- 左侧：会话列表 -->
    <el-aside width="260px" class="conversation-container">
      <div>
        <!-- 左顶部：新建对话 -->
        <el-button class="w-1/1 btn-new-conversation" type="primary">
          <Icon icon="ep:plus" class="mr-5px"/>
          新建对话
        </el-button>
        <!-- 左顶部：搜索对话 -->
        <el-input
          v-model="searchName"
          size="large"
          class="mt-10px search-input"
          placeholder="搜索历史记录"
          @keyup="searchConversation"
        >
          <template #prefix>
            <Icon icon="ep:search"/>
          </template>
        </el-input>
        <!-- 左中间：对话列表 -->
        <div class="conversation-list">
          <!-- TODO @芋艿，置顶、聊天记录、一星期钱、30天前，前端对数据重新做一下分组，或者后端接口改一下 -->
          <div>
            <el-text class="mx-1" size="small" tag="b">置顶</el-text>
          </div>
          <el-row v-for="conversation in conversationList" :key="conversation.id">
            <div
              :class="conversation.id === conversationId ? 'conversation active' : 'conversation'"
              @click="changeConversation(conversation)"
            >
              <div class="title-wrapper">
                <img class="avatar" :src="conversation.avatar"/>
                <span class="title">{{ conversation.title }}</span>
              </div>
              <div class="button-wrapper">
                <el-icon title="编辑" @click="updateConversationTitle(conversation)">
                  <Icon icon="ep:edit"/>
                </el-icon>
                <el-icon title="删除会话" @click="deleteConversationTitle(conversation)">
                  <Icon icon="ep:delete"/>
                </el-icon>
              </div>
            </div>
          </el-row>
        </div>
      </div>
      <!-- 左底部：工具栏 -->
      <div class="tool-box">
        <div>
          <Icon icon="ep:user"/>
          <el-text size="small">角色仓库</el-text>
        </div>
        <div>
          <Icon icon="ep:delete"/>
          <el-text size="small">清空未置顶对话</el-text>
        </div>
      </div>
    </el-aside>
    <!-- 右侧：会话详情 -->
    <el-container class="detail-container">
      <!-- 右顶部 TODO 芋艿：右对齐 -->
      <el-header class="header">
        <div class="title">
          标题......
        </div>
        <div>
          <el-button>3.5-turbo-0125
            <Icon icon="ep:setting"/>
          </el-button>
          <el-button>
            <Icon icon="ep:user"/>
          </el-button>
          <el-button>
            <Icon icon="ep:download"/>
          </el-button>
          <el-button>
            <Icon icon="ep:arrow-up"/>
          </el-button>
        </div>
      </el-header>

      <!--  main    -->
      <el-main class="main-container">
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
                  <div class="left-text" v-html="item.content"></div>
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
                  <div class="right-text" v-html="item.content"></div>
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
      </el-main>
      <el-footer class="footer-container">
        <form @submit.prevent="onSend" class="prompt-from">
          <textarea class="prompt-input" v-model="prompt" @keyup.enter="onSend" placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"></textarea>
          <div class="prompt-btns">
            <el-switch/>
            <el-button type="primary" size="default" @click="onSend()" :loading="conversationInProgress" v-if="conversationInProgress == false">
              {{ conversationInProgress ? '进行中' : '发送'}}
            </el-button>
            <el-button type="danger" size="default" @click="stopStream()" v-if="conversationInProgress == true">
              停止
            </el-button>
          </div>
        </form>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import 'highlight.js/styles/idea.css'
import {ChatMessageApi, ChatMessageSendVO, ChatMessageVO} from "@/api/ai/chat/message"
import {formatDate} from "@/utils/formatTime"
import {useClipboard} from '@vueuse/core'
import { marked } from 'marked'


// 初始化 copy 到粘贴板
const { copy } = useClipboard();

const searchName = ref('') // 查询的内容
const conversationId = ref('1781604279872581648') // 对话id
const conversationInProgress = ref<Boolean>() // 对话进行中
conversationInProgress.value = false

const conversationInAbortController = ref<any>() // 对话进行中 abort 控制器(控制 stream 对话)

const prompt = ref<string>() // prompt

// 判断 消息列表 滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null);
const isScrolling = ref(false)//用于判断用户是否在滚动

/** chat message 列表 */
defineOptions({ name: 'chatMessageList' })
const list = ref<ChatMessageVO[]>([]) // 列表的数据

const changeConversation = (conversation) => {
  console.log(conversation)
  conversationId.value = conversation.id
  // TODO 芋艿：待实现
}

const updateConversationTitle = (conversation) => {
  console.log(conversation)
  // TODO 芋艿：待实现
}

const deleteConversationTitle = (conversation) => {
  console.log(conversation)
  // TODO 芋艿：待实现
}

const searchConversation = () => {
  // TODO 芋艿：待实现
}

/** send */
const onSend = async () => {
  // 进行中不允许发送
  if (conversationInProgress.value) {
    return
  }
  const content = prompt.value;
  // 清空输入框
  prompt.value = ''
  const requestParams = {
    conversationId: conversationId.value,
    content: content,
  } as unknown as ChatMessageSendVO
  // 添加 message
  const userMessage = await ChatMessageApi.add(requestParams) as unknown as ChatMessageVO;
  list.value.push(userMessage)
  // 滚动到住下面
  scrollToBottom();
  // stream
  await doSendStream(userMessage)
  //
}

const doSendStream = async (userMessage: ChatMessageVO) => {
  // 创建AbortController实例，以便中止请求
  conversationInAbortController.value = new AbortController()
  // 标记对话进行中
  conversationInProgress.value = true
  try {
    // 发送 event stream
    let isFirstMessage = true
    ChatMessageApi.sendStream(userMessage.id, conversationInAbortController.value,(message) => {
      console.log('message', message)
      const data = JSON.parse(message.data) as unknown as ChatMessageVO
      // 如果没有内容结束链接
      if (data.content === '') {
        // 标记对话结束
        conversationInProgress.value = false;
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      }
      // 首次返回需要添加一个 message 到页面，后面的都是更新
      if (isFirstMessage) {
        isFirstMessage = false;
        list.value.push(data)
      } else {
        const lastMessage = list.value[list.value.length - 1];
        lastMessage.content = lastMessage.content + data.content
        // markdown
        lastMessage.content = marked(lastMessage.content)
        list.value[list.value - 1] = lastMessage
      }
      // 滚动到最下面
      scrollToBottom();
    }, (error) => {
      console.log('error', error)
      // 标记对话结束
      conversationInProgress.value = false;
      // 结束 stream 对话
      conversationInAbortController.value.abort()
    }, () => {
      console.log('close')
      // 标记对话结束
      conversationInProgress.value = false;
      // 结束 stream 对话
      conversationInAbortController.value.abort()
    })
  } finally {

  }

}

/** 查询列表 */
const messageList = async () => {
  try {
    // 获取列表数据
    const res = await ChatMessageApi.messageList(conversationId.value)

    // 处理 markdown
    // marked(this.markdownText)
    res.map(item => {
      item.content = marked(item.content)
    })

    list.value = res;

    // 滚动到最下面
    scrollToBottom();
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
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  stopStream()
  // 重新获取 message 列表
  await messageList();
}

const stopStream = async () => {
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  if (conversationInAbortController.value) {
    conversationInAbortController.value.abort()
  }
  // 设置为 false
  conversationInProgress.value = false
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
<style lang="scss" scoped>

.ai-layout {
  // TODO @范 这里height不能 100% 先这样临时处理
  position: absolute;
  flex: 1;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  //padding: 15px 15px;
}

.conversation-container {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 10px;
  padding-top: 10px;

  .btn-new-conversation {
    padding: 18px 0;
  }

  .search-input {
    margin-top: 20px;
  }

  .conversation-list {
    margin-top: 20px;

    .conversation {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      flex: 1;
      padding: 0 5px;
      margin-top: 10px;
      cursor: pointer;
      border-radius: 5px;
      align-items: center;
      line-height: 30px;

      &.active {
        background-color: #e6e6e6;

        .button {
          display: inline-block;
        }
      }

      .title-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .title {
        padding: 5px 10px;
        max-width: 220px;
        font-size: 14px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .avatar {
        width: 28px;
        height: 28px;
        display: flex;
        flex-direction: row;
        justify-items: center;
      }

      // 对话编辑、删除
      .button-wrapper {
        right: 2px;
        display: flex;
        flex-direction: row;
        justify-items: center;
        color: #606266;

        .el-icon {
          margin-right: 5px;
        }
      }
    }
  }

  // 角色仓库、清空未设置对话
  .tool-box {
    line-height: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--el-text-color);

    > div {
      display: flex;
      align-items: center;
      color: #606266;
      padding: 0;
      margin: 0;

      > span {
        margin-left: 5px;
      }
    }
  }
}

// 头部
.detail-container {
  background: #ffffff;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: #fbfbfb;
    box-shadow: 0 0 0 0 #dcdfe6;

    .title {
      font-size: 18px;
      font-weight: bold;
    }
  }
}

// main 容器
.main-container {
  margin: 0;
  padding: 0;
  position: relative;
}

.message-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  //width: 100%;
  //height: 100%;
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
      background-color: rgba(228, 228, 228, 0.80);
      box-shadow: 0 0 0 1px rgba(228, 228, 228, 0.80);
      border-radius: 10px;
      padding: 10px 10px 5px 10px;

      .left-text {
        color: #393939;
        //font-size: 14px;
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

// 底部
.footer-container {
  display: flex;
  flex-direction: column;
  height: auto;
  margin: 0;
  padding: 0;

  .prompt-from {
    display: flex;
    flex-direction: column;
    height: auto;
    border: 1px solid #e3e3e3;
    border-radius: 10px;
    margin: 20px 20px;
    padding: 9px 10px;
  }

  .prompt-input {
    height: 80px;
    //box-shadow: none;
    border: none;
    box-sizing: border-box;
    resize: none;
    padding: 0px 2px;
    //padding: 5px 5px;

    overflow: hidden;
  }

  .prompt-input:focus {
    outline: none;
  }

  .prompt-btns {
    display: flex;
    justify-content: space-between;
    padding-bottom: 0px;
    padding-top: 5px;
  }
}
</style>
