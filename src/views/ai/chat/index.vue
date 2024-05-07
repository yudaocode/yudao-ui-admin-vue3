<template>
  <el-container>
    <!-- 左侧：会话列表 -->
    <el-aside width="260px" class="conversation-container">
      <!-- 左顶部：新建对话 -->
      <el-button class="w-1/1" type="primary">
        <Icon icon="ep:plus" class="mr-5px" />
        新建对话
      </el-button>
      <!-- 左顶部：搜索对话 -->
      <el-input
        v-model="searchName"
        class="mt-10px"
        placeholder="搜索历史记录"
        @keyup="searchConversation"
      >
        <template #prefix>
          <Icon icon="ep:search" />
        </template>
      </el-input>
      <!-- 左中间：对话列表 -->
      <div class="conversation-list" :style="{ height: leftHeight + 'px' }">
        <el-row v-for="conversation in conversationList" :key="conversation.id">
          <div
            :class="conversation.id === conversationId ? 'conversation active' : 'conversation'"
            @click="changeConversation(conversation)"
          >
            <el-image :src="conversation.avatar" class="avatar" />
            <span class="title">{{ conversation.title }}</span>
            <span class="button">
              <!-- TODO 芋艿：缺置顶按钮 -->
              <el-icon title="编辑" @click="updateConversationTitle(conversation)">
                <Icon icon="ep:edit" />
              </el-icon>
              <el-icon title="删除会话" @click="deleteConversationTitle(conversation)">
                <Icon icon="ep:delete" />
              </el-icon>
            </span>
          </div>
        </el-row>
      </div>
      <!-- 左底部：工具栏 TODO 芋艿：50% 不太对 -->
      <div class="tool-box">
        <sapn class="w-1/2"> <Icon icon="ep:user" /> 角色仓库 </sapn>
        <sapn class="w-1/2"> <Icon icon="ep:delete" />清空未置顶对话</sapn>
      </div>
    </el-aside>
    <!-- 右侧：会话详情 -->
    <el-container class="detail-container">
      <!-- 右顶部 TODO 芋艿：右对齐 -->
      <el-header class="header">
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
      </el-header>
      <el-main>对话列表</el-main>
      <el-footer>发送消息框</el-footer>
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
.conversation-container {
  .conversation-list {
    .conversation {
      display: flex;
      justify-content: flex-start;
      width: 100%;
      padding: 5px 5px 0 0;
      cursor: pointer;
      &.active {
        // TODO 芋艿：这里不太对
        background-color: #343540;
        .button {
          display: inline;
        }
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
        border-radius: 50%;
      }
      .button {
        position: absolute;
        right: 2px;
        top: 16px;
        .el-icon {
          margin-right: 5px;
        }
      }
    }

    .tool-box {
      display: flex;
      justify-content: flex-start;
      padding: 0 20px 10px 20px;
      border-top: 1px solid black;
    }
  }
}

.detail-container {
  .header {
    width: 100%;
    height: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
  }
}
</style>
