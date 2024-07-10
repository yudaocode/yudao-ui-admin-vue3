<template>
  <div class="kefu">
    <div
      v-for="(item, index) in conversationList"
      :key="item.id"
      :class="{ active: index === activeConversationIndex, pinned: item.adminPinned }"
      class="kefu-conversation flex items-center"
      @click="openRightMessage(item, index)"
      @contextmenu.prevent="rightClick($event as PointerEvent, item)"
    >
      <div class="flex justify-center items-center w-100%">
        <!-- TODO style 换成 unocss -->
        <div class="flex justify-center items-center" style="width: 50px; height: 50px">
          <!-- 头像 + 未读 -->
          <el-badge
            :hidden="item.adminUnreadMessageCount === 0"
            :max="99"
            :value="item.adminUnreadMessageCount"
          >
            <el-avatar :src="item.userAvatar" alt="avatar" />
          </el-badge>
        </div>
        <div class="ml-10px w-100%">
          <div class="flex justify-between items-center w-100%">
            <span>{{ item.userNickname }}</span>
            <span class="color-[#989EA6]">
              {{ formatDate(item.lastMessageTime) }}
            </span>
          </div>
          <!-- 文本消息 -->
          <template v-if="KeFuMessageContentTypeEnum.TEXT === item.lastMessageContentType">
            <div
              v-dompurify-html="replaceEmoji(item.lastMessageContent)"
              class="last-message flex items-center color-[#989EA6]"
            ></div>
          </template>
          <!-- 图片消息 -->
          <template v-else>
            <div class="last-message flex items-center color-[#989EA6]">
              {{ getContentType(item.lastMessageContentType) }}
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 右键，进行操作（类似微信） -->
    <ul v-show="showRightMenu" :style="rightMenuStyle" class="right-menu-ul">
      <li
        v-show="!selectedConversation.adminPinned"
        class="flex items-center"
        @click.stop="updateConversationPinned(true)"
      >
        <Icon class="mr-5px" icon="ep:top" />
        置顶会话
      </li>
      <li
        v-show="selectedConversation.adminPinned"
        class="flex items-center"
        @click.stop="updateConversationPinned(false)"
      >
        <Icon class="mr-5px" icon="ep:bottom" />
        取消置顶
      </li>
      <li class="flex items-center" @click.stop="deleteConversation">
        <Icon class="mr-5px" color="red" icon="ep:delete" />
        删除会话
      </li>
      <li class="flex items-center" @click.stop="closeRightMenu">
        <Icon class="mr-5px" color="red" icon="ep:close" />
        取消
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { KeFuConversationApi, KeFuConversationRespVO } from '@/api/mall/promotion/kefu/conversation'
import { useEmoji } from './tools/emoji'
import { formatDate } from '@/utils/formatTime'
import { KeFuMessageContentTypeEnum } from './tools/constants'

defineOptions({ name: 'KeFuConversationBox' })

const message = useMessage() // 消息弹窗

const { replaceEmoji } = useEmoji()
const conversationList = ref<KeFuConversationRespVO[]>([]) // 会话列表
const activeConversationIndex = ref(-1) // 选中的会话 index 位置 TODO @puhui999：这个可以改成 activeConversationId 么？因为一般是选中的对话编号

/** 加载会话列表 */
const getConversationList = async () => {
  conversationList.value = await KeFuConversationApi.getConversationList()
}
defineExpose({ getConversationList })

/** 打开右侧的消息列表 */
const emits = defineEmits<{
  (e: 'change', v: KeFuConversationRespVO): void
}>()
const openRightMessage = (item: KeFuConversationRespVO, index: number) => {
  activeConversationIndex.value = index
  emits('change', item)
}

// TODO @puhui999：这个，是不是改成 getConversationDisplayText，获取会话的展示文本。然后，把文本消息类型，也统一处理（包括上面的 replaceEmoji）。这样，更统一。
/** 获得消息类型 */
const getContentType = computed(() => (lastMessageContentType: number) => {
  switch (lastMessageContentType) {
    case KeFuMessageContentTypeEnum.SYSTEM:
      return '[系统消息]'
    case KeFuMessageContentTypeEnum.VIDEO:
      return '[视频消息]'
    case KeFuMessageContentTypeEnum.IMAGE:
      return '[图片消息]'
    case KeFuMessageContentTypeEnum.PRODUCT:
      return '[商品消息]'
    case KeFuMessageContentTypeEnum.ORDER:
      return '[订单消息]'
    case KeFuMessageContentTypeEnum.VOICE:
      return '[语音消息]'
    default:
      return ''
  }
})

//======================= 右键菜单 =======================
const showRightMenu = ref(false) // 显示右键菜单
const rightMenuStyle = ref<any>({}) // 右键菜单 Style
const selectedConversation = ref<KeFuConversationRespVO>({} as KeFuConversationRespVO) // 右键选中的会话对象 TODO puhui999：这个是不是叫 rightClickConversation 会好点。因为 selected 容易和选中的对话，定义上有点重叠

/** 打开右键菜单 */
const rightClick = (mouseEvent: PointerEvent, item: KeFuConversationRespVO) => {
  selectedConversation.value = item
  // 显示右键菜单
  showRightMenu.value = true
  rightMenuStyle.value = {
    top: mouseEvent.clientY - 110 + 'px',
    left: mouseEvent.clientX - 80 + 'px'
  }
}
/** 关闭右键菜单 */
const closeRightMenu = () => {
  showRightMenu.value = false
}

/** 置顶会话 */
const updateConversationPinned = async (adminPinned: boolean) => {
  // 1. 会话置顶/取消置顶
  await KeFuConversationApi.updateConversationPinned({
    id: selectedConversation.value.id,
    adminPinned
  })
  message.notifySuccess(adminPinned ? '置顶成功' : '取消置顶成功')
  // 2. 关闭右键菜单，更新会话列表
  closeRightMenu()
  await getConversationList()
}

/** 删除会话 */
const deleteConversation = async () => {
  // 1. 删除会话
  await message.confirm('您确定要删除该会话吗？')
  await KeFuConversationApi.deleteConversation(selectedConversation.value.id)
  // 2. 关闭右键菜单，更新会话列表
  closeRightMenu()
  await getConversationList()
}

/** 监听右键菜单的显示状态，添加点击事件监听器 */
watch(showRightMenu, (val) => {
  if (val) {
    document.body.addEventListener('click', closeRightMenu)
  } else {
    document.body.removeEventListener('click', closeRightMenu)
  }
})
</script>

<style lang="scss" scoped>
.kefu {
  &-conversation {
    height: 60px;
    padding: 10px;
    background-color: #fff;
    transition: border-left 0.05s ease-in-out; /* 设置过渡效果 */

    .last-message {
      width: 200px;
      overflow: hidden; // 隐藏超出的文本
      white-space: nowrap; // 禁止换行
      text-overflow: ellipsis; // 添加省略号
    }
  }

  .active {
    border-left: 5px #3271ff solid;
    background-color: #eff0f1;
  }

  .pinned {
    background-color: #eff0f1;
  }

  .right-menu-ul {
    position: absolute;
    background-color: #fff;
    padding: 10px;
    margin: 0;
    list-style-type: none; /* 移除默认的项目符号 */
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 阴影效果 */
    width: 130px;

    li {
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 12px;
      transition: background-color 0.3s; /* 平滑过渡 */
      &:hover {
        background-color: #e0e0e0; /* 悬停时的背景颜色 */
      }
    }
  }
}
</style>
