<!--  AI 对话  -->
<template>
  <el-aside width="260px" class="conversation-container">

    <!-- 左顶部：对话 -->
    <div>
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
        <div v-for="conversationKey in Object.keys(conversationMap)" :key="conversationKey">
          <div v-if="conversationMap[conversationKey].length">
            <el-text class="mx-1" size="small" tag="b">{{ conversationKey }}</el-text>
          </div>
          <el-row
            v-for="conversation in conversationMap[conversationKey]"
            :key="conversation.id"
            @click="handleConversationClick(conversation.id)">
            <div
              :class="conversation.id === activeConversationId ? 'conversation active' : 'conversation'"
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

    <!-- ============= 额外组件 ============= -->

    <!--   角色仓库抽屉  -->
    <el-drawer v-model="drawer" title="角色仓库" size="50%">
      <Role/>
    </el-drawer>

  </el-aside>
</template>

<script setup lang="ts">
import {ChatConversationApi, ChatConversationVO} from '@/api/ai/chat/conversation'
import {ref} from "vue";
import Role from "@/views/ai/chat/role/index.vue";

const message = useMessage() // 消息弹窗

// 定义属性
const searchName = ref<string>('') // 对话搜索
const activeConversationId = ref<number | null>(null) // 选中的对话，默认为 null
const conversationList = ref([] as ChatConversationVO[])  // 对话列表
const conversationMap = ref<any>({})  // 对话分组 (置顶、今天、三天前、一星期前、一个月前)
const drawer = ref<boolean>(false) // 角色仓库抽屉

// 定义组件 props
const props = defineProps({
  activeId: {
    type: Number || null,
    required: true
  }
})

// 定义钩子
const emits = defineEmits(['onConversationClick', 'onConversationClear'])

/**
 * 对话 - 搜索
 */
const searchConversation = () => {
  // TODO fan：待实现
}

/**
 * 对话 - 点击
 */
const handleConversationClick = async (id: number) => {
  // 切换对话
  activeConversationId.value = id

  const filterConversation = conversationList.value.filter(item => {
    return item.id !== id
  })
  // 回调 onConversationClick
  emits('onConversationClick', filterConversation[0])
}

/**
 * 对话 - 获取列表
 */
const getChatConversationList = async () => {
  // 1、获取 对话数据
  conversationList.value = await ChatConversationApi.getChatConversationMyList()
  // 2、没有 任何对话情况
  if (conversationList.value.length === 0) {
    activeConversationId.value = null
    conversationMap.value = {}
    return
  }
  // 3、对话根据时间分组(置顶、今天、一天前、三天前、七天前、30天前)
  conversationMap.value = await conversationTimeGroup(conversationList.value)
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

/**
 * 对话 - 新建
 */
const createConversation = async () => {
  // 1、新建对话
  const conversationId = await ChatConversationApi.createChatConversationMy(
    {} as unknown as ChatConversationVO
  )
  // 2、选中对话
  await handleConversationClick(conversationId)
  // 3、获取对话内容
  await getChatConversationList()
}

/**
 * 对话 - 更新标题
 */
const updateConversationTitle = async (conversation: ChatConversationVO) => {
  // 1、二次确认
  const {value} = await ElMessageBox.prompt('修改标题', {
    inputPattern: /^[\s\S]*.*\S[\s\S]*$/, // 判断非空，且非空格
    inputErrorMessage: '标题不能为空',
    inputValue: conversation.title
  })
  // 2、发起修改
  await ChatConversationApi.updateChatConversationMy({
    id: conversation.id,
    title: value
  } as ChatConversationVO)
  message.success('重命名成功')
  // 刷新列表
  await getChatConversationList()
}

/**
 * 删除聊天会话
 */
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


// ============ 角色仓库


/**
 * 角色仓库抽屉
 */
const handleRoleRepository = async () => {
  drawer.value = !drawer.value
}

// ============= 清空对话


/**
 * 清空对话
 */
const handleClearConversation = async () => {
  ElMessageBox.confirm(
    '确认后对话会全部清空，置顶的对话除外。',
    '确认提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    .then(async () => {
      await ChatConversationApi.deleteMyAllExceptPinned()
      ElMessage({
        message: '操作成功!',
        type: 'success'
      })
      // 清空 对话 和 对话内容
      activeConversationId.value = null
      // 获取 对话列表
      await getChatConversationList()
      // 回调 方法
      emits('onConversationClear')
    })
    .catch(() => {
    })
}

// ============ 组件 onMounted

onMounted(async () => {
  //
  if (props.activeId != null) {

  }
  // 获取 对话列表
  await getChatConversationList()
})

</script>

<style scoped lang="scss">

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
</style>
