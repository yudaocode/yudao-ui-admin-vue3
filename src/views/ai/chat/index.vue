<template>
  <el-container class="ai-layout">
    <!-- 左侧：会话列表 -->
    <el-aside width="260px" class="conversation-container">
      <div>
        <!-- 左顶部：新建对话 -->
        <el-button class="w-1/1 btn-new-conversation" type="primary" @click="createConversation">
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
          <!-- TODO @fain：置顶、聊天记录、一星期钱、30天前，前端对数据重新做一下分组，或者后端接口改一下 -->
          <div v-for="conversationKey in Object.keys(conversationMap)" :key="conversationKey" >
            <div v-if="conversationMap[conversationKey].length">
              <el-text class="mx-1" size="small" tag="b">{{conversationKey}}</el-text>
            </div>
            <el-row
              v-for="conversation in conversationMap[conversationKey]" 
              :key="conversation.id"
              @click="handleConversationClick(conversation.id)">
              <div
                :class="conversation.id === conversationId ? 'conversation active' : 'conversation'"
                @click="changeConversation(conversation.id)"
              >
                <div class="title-wrapper">
                  <img class="avatar" :src="conversation.roleAvatar"/>
                  <span class="title">{{ conversation.title }}</span>
                </div>
                <!-- TODO @fan：缺一个【置顶】按钮，效果改成 hover 上去展示 -->
                <div class="button-wrapper">
                  <el-icon title="编辑" @click="updateConversationTitle(conversation)">
                    <Icon icon="ep:edit"/>
                  </el-icon>
                  <el-icon title="删除会话" @click="deleteChatConversation(conversation)">
                    <Icon icon="ep:delete"/>
                  </el-icon>
                </div>
              </div>
            </el-row>
          </div>
        </div>
      </div>
      <!-- 左底部：工具栏 -->
      <div class="tool-box">
        <div @click="handleRoleRepository">
          <Icon icon="ep:user"/>
          <el-text size="small">角色仓库</el-text>
        </div>
        <div @click="handleClearConversation">
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
          {{ useConversation?.title }}
        </div>
        <div>
          <!-- TODO @fan：样式改下；这里我已经改成点击后，弹出了 -->
          <el-button type="primary" @click="openChatConversationUpdateForm">
            <span v-html="useConversation?.modelName"></span>
            <Icon icon="ep:setting" style="margin-left: 10px"/>
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
            <!-- TODO 芋艿：类型判断 -->
            <div class="left-message message-item" v-if="item.type === 'system'">
              <div class="avatar">
                <el-avatar
                  src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
                />
              </div>
              <div class="message">
                <div>
                  <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
                </div>
                <div class="left-text-container" ref="markdownViewRef">
                  <div class="left-text markdown-view" v-html="item.content"></div>
                  <!--                  <mdPreview :content="item.content" :delay="false" />-->
                </div>
                <div class="left-btns">
                  <div class="btn-cus" @click="noCopy(item.content)">
                    <img class="btn-image" src="../../../assets/ai/copy.svg"/>
                    <el-text class="btn-cus-text">复制</el-text>
                  </div>
                  <div class="btn-cus" style="margin-left: 20px" @click="onDelete(item.id)">
                    <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px"/>
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
                  <el-text class="time">{{ formatDate(item.createTime) }}</el-text>
                </div>
                <div class="right-text-container">
                  <div class="right-text">{{ item.content }}</div>
                </div>
                <div class="right-btns">
                  <div class="btn-cus" @click="noCopy(item.content)">
                    <img class="btn-image" src="@/assets/ai/copy.svg"/>
                    <el-text class="btn-cus-text">复制</el-text>
                  </div>
                  <div class="btn-cus" style="margin-left: 20px" @click="onDelete(item.id)">
                    <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px"/>
                    <el-text class="btn-cus-text">删除</el-text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!--   角色仓库抽屉  -->
        <el-drawer v-model="drawer" title="角色仓库" size="50%">
          <Role/>
        </el-drawer>
      </el-main>
      <el-footer class="footer-container">
        <form @submit.prevent="onSend" class="prompt-from">
          <textarea
            class="prompt-input"
            v-model="prompt"
            @keyup.enter="onSend"
            @input="onPromptInput"
            @compositionstart="onCompositionstart"
            @compositionend="onCompositionend"
            placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
          ></textarea>
          <div class="prompt-btns">
            <el-switch/>
            <el-button
              type="primary"
              size="default"
              @click="onSend()"
              :loading="conversationInProgress"
              v-if="conversationInProgress == false"
            >
              {{ conversationInProgress ? '进行中' : '发送' }}
            </el-button>
            <el-button
              type="danger"
              size="default"
              @click="stopStream()"
              v-if="conversationInProgress == true"
            >
              停止
            </el-button>
          </div>
        </form>
      </el-footer>
    </el-container>
  </el-container>

  <ChatConversationUpdateForm
    ref="chatConversationUpdateFormRef"
    @success="getChatConversationList"
  />
</template>

<script setup lang="ts">
import {ChatMessageApi, ChatMessageVO} from '@/api/ai/chat/message'
import {ChatConversationApi, ChatConversationVO} from '@/api/ai/chat/conversation'
import ChatConversationUpdateForm from './components/ChatConversationUpdateForm.vue'
import Role from '@/views/ai/chat/role/index.vue'
import {formatDate} from '@/utils/formatTime'
import {useClipboard} from '@vueuse/core'
// 转换 markdown
import {marked} from 'marked'
// 代码高亮 https://highlightjs.org/
import 'highlight.js/styles/vs2015.min.css'
import hljs from 'highlight.js'

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗

// 自定义渲染器
const renderer = {
  code(code, language, c) {
    const highlightHtml = hljs.highlight(code, {language: language, ignoreIllegals: true}).value
    const copyHtml = `<div id="copy" data-copy='${code}' style="position: absolute; right: 10px; top: 5px; color: #fff;cursor: pointer;">复制</div>`
    return `<pre>${copyHtml}<code class="hljs">${highlightHtml}</code></pre>`
  }
}
marked.use({
  renderer: renderer
})

const conversationList = ref([] as ChatConversationVO[])
const conversationMap = ref<any>({})
// 初始化 copy 到粘贴板
const {copy} = useClipboard()

const drawer = ref<boolean>(false) // 角色仓库抽屉
const searchName = ref('') // 查询的内容
const inputTimeout = ref<any>() // 处理输入中回车的定时器
const conversationId = ref<number | null>(null) // 选中的对话编号
const conversationInProgress = ref(false) // 对话进行中
const conversationInAbortController = ref<any>() // 对话进行中 abort 控制器(控制 stream 对话)

const prompt = ref<string>() // prompt

// 判断 消息列表 滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null)
const isScrolling = ref(false) //用于判断用户是否在滚动
const isComposing = ref(false) // 判断用户是否在输入

/** chat message 列表 */
// defineOptions({ name: 'chatMessageList' })
const list = ref<ChatMessageVO[]>([]) // 列表的数据
const useConversation = ref<ChatConversationVO | null>(null) // 使用的 Conversation

/** 新建对话 */
const createConversation = async () => {
  // 新建对话
  const conversationId = await ChatConversationApi.createChatConversationMy(
    {} as unknown as ChatConversationVO
  )
  changeConversation(conversationId)
  // 刷新对话列表
  await getChatConversationList()
}

const changeConversation = (id: number) => {
  conversationId.value = id
  // TODO 芋艿：待实现
}

/** 更新聊天会话的标题 */
const updateConversationTitle = async (conversation: ChatConversationVO) => {
  // 二次确认
  const {value} = await ElMessageBox.prompt('修改标题', {
    inputPattern: /^[\s\S]*.*\S[\s\S]*$/, // 判断非空，且非空格
    inputErrorMessage: '标题不能为空',
    inputValue: conversation.title
  })
  // 发起修改
  await ChatConversationApi.updateChatConversationMy({
    id: conversation.id,
    title: value
  } as ChatConversationVO)
  message.success('重命名成功')
  // 刷新列表
  await getChatConversationList()
}

/** 删除聊天会话 */
const deleteChatConversation = async (conversation: ChatConversationVO) => {
  try {
    // 删除的二次确认
    await message.delConfirm(`是否确认删除会话 - ${conversation.title}?`)
    // 发起删除
    await ChatConversationApi.deleteChatConversationMy(conversation.id)
    message.success('会话已删除')
    // 刷新列表
    await getChatConversationList()
  } catch {
  }
}

const searchConversation = () => {
  // TODO fan：待实现
}

/** send */
const onSend = async () => {
  // 判断用户是否在输入
  if (isComposing.value) {
    return
  }
  // 进行中不允许发送
  if (conversationInProgress.value) {
    return
  }
  const content = prompt.value?.trim() + ''
  if (content.length < 2) {
    ElMessage({
      message: '请输入内容!',
      type: 'error'
    })
    return
  }
  // TODO 芋艿：这块交互要在优化；应该是先插入到 UI 界面，里面会有当前的消息，和正在思考中；之后发起请求；
  // 清空输入框
  prompt.value = ''
  // const requestParams = {
  //   conversationId: conversationId.value,
  //   content: content
  // } as unknown as ChatMessageSendVO
  // // 添加 message
  const userMessage = {
    conversationId: conversationId.value,
    content: content
  } as ChatMessageVO
  // list.value.push(userMessage)
  // // 滚动到住下面
  // scrollToBottom()
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
    let content = ''
    ChatMessageApi.sendStream(
      userMessage.conversationId, // TODO 芋艿：这里可能要在优化；
      userMessage.content,
      conversationInAbortController.value,
      (message) => {
        console.log('message', message)
        const data = JSON.parse(message.data) // TODO 芋艿：类型处理；
        // debugger
        // 如果没有内容结束链接
        if (data.receive.content === '') {
          // 标记对话结束
          conversationInProgress.value = false
          // 结束 stream 对话
          conversationInAbortController.value.abort()
        }
        // 首次返回需要添加一个 message 到页面，后面的都是更新
        if (isFirstMessage) {
          isFirstMessage = false
          // debugger
          list.value.push(data.send)
          list.value.push(data.receive)
        } else {
          // debugger
          content = content + data.receive.content
          const lastMessage = list.value[list.value.length - 1]
          lastMessage.content = marked(content) as unknown as string
          list.value[list.value - 1] = lastMessage
        }
        // 滚动到最下面
        scrollToBottom()
      },
      (error) => {
        console.log('error', error)
        // 标记对话结束
        conversationInProgress.value = false
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      },
      () => {
        console.log('close')
        // 标记对话结束
        conversationInProgress.value = false
        // 结束 stream 对话
        conversationInAbortController.value.abort()
      }
    )
  } finally {
  }
}

/** 查询列表 */
const messageList = async () => {
  try {
    if (!conversationId.value) {
      return
    }
    // 获取列表数据
    const res = await ChatMessageApi.messageList(conversationId.value)

    // 处理 markdown
    // marked(this.markdownText)
    res.map((item) => {
      // item.content = marked(item.content)
      if (item.type !== 'user') {
        item.content = marked(item.content)
      }
    })

    list.value = res

    // 滚动到最下面
    scrollToBottom()
  } finally {
  }
}

function scrollToBottom() {
  nextTick(() => {
    //注意要使用nexttick以免获取不到dom
    console.log('isScrolling.value', isScrolling.value)
    if (!isScrolling.value) {
      messageContainer.value.scrollTop =
        messageContainer.value.scrollHeight - messageContainer.value.offsetHeight
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
    type: 'success'
  })
}

const onDelete = async (id) => {
  // 删除 message
  await ChatMessageApi.delete(id)
  ElMessage({
    message: '删除成功!',
    type: 'success'
  })
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  stopStream()
  // 重新获取 message 列表
  await messageList()
}

const stopStream = async () => {
  // tip：如果 stream 进行中的 message，就需要调用 controller 结束
  if (conversationInAbortController.value) {
    conversationInAbortController.value.abort()
  }
  // 设置为 false
  conversationInProgress.value = false
}

/** 修改聊天会话 */
const chatConversationUpdateFormRef = ref()
const openChatConversationUpdateForm = async () => {
  chatConversationUpdateFormRef.value.open(conversationId.value)
}

// 输入
const onCompositionstart = () => {
  console.log('onCompositionstart。。。.')
  isComposing.value = true
}

const onCompositionend = () => {
  // console.log('输入结束...')
  setTimeout(() => {
    console.log('输入结束...')
    isComposing.value = false
  }, 200)
}

const onPromptInput = (event) => {
  // 非输入法 输入设置为 true
  if (!isComposing.value) {
    // 回车 event data 是 null
    if (event.data == null) {
      return
    }
    console.log('setTimeout 输入开始...')
    isComposing.value = true
  }
  // 清理定时器
  if (inputTimeout.value) {
    clearTimeout(inputTimeout.value)
  }
  // 重置定时器
  inputTimeout.value = setTimeout(() => {
    console.log('setTimeout 输入结束...')
    isComposing.value = false
  }, 400)
}

const getConversation = async (conversationId: number | null) => {
  if (!conversationId) {
    return
  }
  // 获取对话信息
  useConversation.value = await ChatConversationApi.getChatConversationMy(conversationId)
  console.log('useConversation.value', useConversation.value)
}

/** 获得聊天会话列表 */
const getChatConversationList = async () => {
  conversationList.value = await ChatConversationApi.getChatConversationMyList()
  // 默认选中第一条
  if (conversationList.value.length === 0) {
    conversationId.value = 0
    // TODO 芋艿：清空对话
  } else {
    if (conversationId.value === 0) {
      conversationId.value = conversationList.value[0].id
      changeConversation(conversationList.value[0].id)
    }
  }
  // map  
  const groupRes = await conversationTimeGroup(conversationList.value)
  conversationMap.value = groupRes
}

const conversationTimeGroup = async (list: ChatConversationVO[]) => {
  // 排序、指定、时间分组(今天、一天前、三天前、七天前、30天前)
  const groupMap = {
    '置顶': [],
    '今天': [],
    '一天前': [],
    '三天前': [],
    '七天前': [],
    '三十天前': []
  }
  // 当前时间的时间戳
  const now = Date.now();
  // 定义时间间隔常量（单位：毫秒）
  const oneDay = 24 * 60 * 60 * 1000;
  const threeDays = 3 * oneDay;
  const sevenDays = 7 * oneDay;
  const thirtyDays = 30 * oneDay;
  console.log('listlistlist', list)
  for (const conversation: ChatConversationVO of list) {
    // 置顶
    if (conversation.pinned) {
      groupMap['置顶'].push(conversation)
      continue
    }
    // 计算时间差（单位：毫秒）
    const diff = now - conversation.updateTime;
    // 根据时间间隔判断
    if (diff < oneDay) {
      groupMap['今天'].push(conversation)
    } else if (diff < threeDays) {
      groupMap['一天前'].push(conversation)
    } else if (diff < sevenDays) {
      groupMap['三天前'].push(conversation)
    } else if (diff < thirtyDays) {
      groupMap['七天前'].push(conversation)
    } else {
      groupMap['三十天前'].push(conversation)
    }
  }
  return groupMap
}


// 对话点击
const handleConversationClick = async (id: number) => {
  // 切换对话
  conversationId.value = id
  console.log('conversationId.value', conversationId.value)
  // 获取列表数据
  await messageList()
}

// 角色仓库
const handleRoleRepository = async () => {
  drawer.value = !drawer.value
}

// 清空对话
const handleClearConversation = async () => {
  await ChatConversationApi.deleteMyAllExceptPinned()
  ElMessage({
    message: '操作成功!',
    type: 'success'
  })
  // 清空选中的对话
  useConversation.value = null
  conversationId.value = null
  // 获得聊天会话列表
  await getChatConversationList()
}


/** 初始化 **/
onMounted(async () => {
  // 设置当前对话
  if (route.query.conversationId) {
    conversationId.value = route.query.conversationId as number
  }
  // 获得聊天会话列表
  await getChatConversationList()
  // 获取对话信息
  await getConversation(conversationId.value)
  // 获取列表数据
  await messageList()
  // scrollToBottom();
  // await nextTick
  // 监听滚动事件，判断用户滚动状态
  messageContainer.value.addEventListener('scroll', handleScroll)
  // 添加 copy 监听
  messageContainer.value.addEventListener('click', (e: any) => {
    console.log(e)
    if (e.target.id === 'copy') {
      copy(e.target?.dataset?.copy)
      ElMessage({
        message: '复制成功!',
        type: 'success'
      })
    }
  })
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
      cursor: pointer;

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
      background-color: rgba(228, 228, 228, 0.8);
      box-shadow: 0 0 0 1px rgba(228, 228, 228, 0.8);
      border-radius: 10px;
      padding: 10px 10px 5px 10px;

      .left-text {
        color: #393939;
        font-size: 0.95rem;
      }
    }

    .right-text-container {
      display: flex;
      flex-direction: row-reverse;

      .right-text {
        font-size: 0.95rem;
        color: #fff;
        display: inline;
        background-color: #267fff;
        color: #fff;
        box-shadow: 0 0 0 1px #267fff;
        border-radius: 10px;
        padding: 10px;
        width: auto;
        overflow-wrap: break-word;
      }
    }

    .left-btns,
    .right-btns {
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

<style lang="scss">
.markdown-view {
  font-family: PingFang SC;
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.6rem;
  letter-spacing: 0em;
  text-align: left;
  color: #3b3e55;
  max-width: 100%;

  pre {
    position: relative;
  }

  pre code.hljs {
    width: auto;
  }

  code.hljs {
    border-radius: 6px;
    padding-top: 20px;
    width: auto;
    @media screen and (min-width: 1536px) {
      width: 960px;
    }

    @media screen and (max-width: 1536px) and (min-width: 1024px) {
      width: calc(100vw - 400px - 64px - 32px * 2);
    }

    @media screen and (max-width: 1024px) and (min-width: 768px) {
      width: calc(100vw - 32px * 2);
    }

    @media screen and (max-width: 768px) {
      width: calc(100vw - 16px * 2);
    }
  }

  p,
  code.hljs {
    margin-bottom: 16px;
  }

  p {
    //margin-bottom: 1rem !important;
    margin: 0;
    margin-bottom: 3px;
  }

  /* 标题通用格式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-G900);
    margin: 24px 0 8px;
    font-weight: 600;
  }

  h1 {
    font-size: 22px;
    line-height: 32px;
  }

  h2 {
    font-size: 20px;
    line-height: 30px;
  }

  h3 {
    font-size: 18px;
    line-height: 28px;
  }

  h4 {
    font-size: 16px;
    line-height: 26px;
  }

  h5 {
    font-size: 16px;
    line-height: 24px;
  }

  h6 {
    font-size: 16px;
    line-height: 24px;
  }

  /* 列表（有序，无序） */
  ul,
  ol {
    margin: 0 0 8px 0;
    padding: 0;
    font-size: 16px;
    line-height: 24px;
    color: #3b3e55; // var(--color-CG600);
  }

  li {
    margin: 4px 0 0 20px;
    margin-bottom: 1rem;
  }

  ol > li {
    list-style-type: decimal;
    margin-bottom: 1rem;
    // 表达式,修复有序列表序号展示不全的问题
    // &:nth-child(n + 10) {
    //     margin-left: 30px;
    // }

    // &:nth-child(n + 100) {
    //     margin-left: 30px;
    // }
  }

  ul > li {
    list-style-type: disc;
    font-size: 16px;
    line-height: 24px;
    margin-right: 11px;
    margin-bottom: 1rem;
    color: #3b3e55; // var(--color-G900);
  }

  ol ul,
  ol ul > li,
  ul ul,
  ul ul li {
    // list-style: circle;
    font-size: 16px;
    list-style: none;
    margin-left: 6px;
    margin-bottom: 1rem;
  }

  ul ul ul,
  ul ul ul li,
  ol ol,
  ol ol > li,
  ol ul ul,
  ol ul ul > li,
  ul ol,
  ul ol > li {
    list-style: square;
  }
}
</style>
