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
      <el-main>

        <div class="chat-list">
          <!--  靠左 message  -->
          <div class="left-message message-item">
            <div class="avatar">
              <el-avatar
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
              />
            </div>
            <div class="message">
              <div>
                <el-text class="time">2024-05-10 22:38</el-text>
              </div>
              <div class="left-text-container">
                <el-text class="left-text">
                  如果您想获取某个网页或程序的截图，可以使用浏览器自带的截图功能，或者使用第三方截图工具，如Snipping
                  Tool、FastStone Capture等。如果您想将屏幕上的某个区域截取下来，可以使用键盘上的“Prt
                  Sc”键（或“Print Screen”键）来获取整个屏幕的截图，并将其粘贴到图像编辑软件中进行编辑和保存。
                  如果您需要更具体的帮助，例如如何使用特定的截图工具或如何编辑截图，请提供更多详细信息，我将尽力为您提供帮助。
                </el-text>

              </div>
              <div class="left-btns">
                <div class="btn-cus">
                  <img class="btn-image" src="@/assets/ai/copy.svg"/>
                  <el-text class="btn-cus-text">复制</el-text>
                </div>
                <div class="btn-cus" style="margin-left: 20px;">
                  <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px;"/>
                  <el-text class="btn-cus-text">删除</el-text>
                </div>
              </div>
            </div>
          </div>
          <!--  靠右 message  -->
          <div class="right-message message-item">
            <div class="avatar">
              <el-avatar
                src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
              />
            </div>
            <div class="message">
              <div>
                <el-text class="time">2024-05-10 22:38</el-text>
              </div>
              <div class="right-text-container">
                <el-text class="right-text">
                  今天天气
                </el-text>
              </div>
              <div class="right-btns">
                <div class="btn-cus">
                  <img class="btn-image" src="@/assets/ai/copy.svg"/>
                  <el-text class="btn-cus-text">复制</el-text>
                </div>
                <div class="btn-cus" style="margin-left: 20px;">
                  <img class="btn-image" src="@/assets/ai/delete.svg" style="height: 17px;"/>
                  <el-text class="btn-cus-text">删除</el-text>
                </div>
              </div>
            </div>

          </div>
        </div>


      </el-main>
      <el-footer class="footer-container">
        <textarea placeholder="问我任何问题...（Shift+Enter 换行，按下 Enter 发送）"
                  class="prompt-input">
        </textarea>
        <div class="prompt-btns">
          <el-switch/>
          <el-button type="primary" size="default">发送</el-button>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>
<script setup lang="ts">
const conversationList = [
  {
    id: 1,
    title: '测试标题',
    avatar:
      'http://test.yudao.iocoder.cn/96c787a2ce88bf6d0ce3cd8b6cf5314e80e7703cd41bf4af8cd2e2909dbd6b6d.png'
  },
  {
    id: 2,
    title: '测试对话',
    avatar:
      'http://test.yudao.iocoder.cn/96c787a2ce88bf6d0ce3cd8b6cf5314e80e7703cd41bf4af8cd2e2909dbd6b6d.png'
  }
]
const conversationId = ref(1)
const searchName = ref('')
const leftHeight = window.innerHeight - 240 // TODO 芋艿：这里还不太对

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

// 中间
.chat-list {
  display: flex;
  flex-direction: column;

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


// 底部
.footer-container {
  display: flex;
  flex-direction: column;
  height: auto;
  border: 1px solid #e3e3e3;
  border-radius: 10px;
  margin: 20px 20px;
  padding: 9px 10px;

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
