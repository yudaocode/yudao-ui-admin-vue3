<template>
  <el-container class="ai-layout">
    <!-- 左侧：会话列表 -->
    <el-aside width="260px" class="conversation-container">
      <div>
        <!-- 左顶部：新建对话 -->
        <el-button class="w-1/1 btn-new-conversation" type="primary">
          <Icon icon="ep:plus" class="mr-5px" />
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
            <Icon icon="ep:search" />
          </template>
        </el-input>
        <!-- 左中间：对话列表 -->
        <div class="conversation-list" >
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
                <img class="avatar" :src="conversation.avatar" />
                <span class="title">{{ conversation.title }}</span>
              </div>
              <div class="button-wrapper">
                <el-icon title="编辑" @click="updateConversationTitle(conversation)">
                  <Icon icon="ep:edit" />
                </el-icon>
                <el-icon title="删除会话" @click="deleteConversationTitle(conversation)">
                  <Icon icon="ep:delete" />
                </el-icon>
              </div>
            </div>
          </el-row>
        </div>
      </div>
      <!-- 左底部：工具栏 -->
      <div class="tool-box">
        <div>
          <Icon icon="ep:user" />
          <el-text size="small">角色仓库</el-text>
        </div>
        <div>
          <Icon icon="ep:delete" />
          <el-text size="small" >清空未置顶对话</el-text>
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
          <el-button>3.5-turbo-0125 <Icon icon="ep:setting" /></el-button>
          <el-button>
            <Icon icon="ep:user" />
          </el-button>
          <el-button>
            <Icon icon="ep:download" />
          </el-button>
          <el-button>
            <Icon icon="ep:arrow-up" />
          </el-button>
        </div>
      </el-header>
      <el-main>对话列表</el-main>
      <el-footer>
        <el-input
          class="prompt-input"
          type="textarea"
          placeholder="请输入提示词..."
        />
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

.detail-container {
  background: #ffffff;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: #fbfbfb;

    .title {
      font-size: 23px;
      font-weight: bold;
    }
  }


  .prompt-input {

  }
}
</style>
