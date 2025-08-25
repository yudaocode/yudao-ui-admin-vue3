<template>
  <div ref="messageContainer" class="h-100% overflow-y-auto relative">
    <div class="flex flex-col overflow-y-hidden px-20px" v-for="(item, index) in list" :key="index">
      <!-- 靠左 message：system、assistant 类型 -->
      <div class="flex flex-row mt-50px" v-if="item.type !== 'user'">
        <div class="avatar">
          <el-avatar :src="roleAvatar" />
        </div>
        <div class="flex flex-col text-left mx-15px">
          <div>
            <el-text class="text-left leading-30px">{{ formatDate(item.createTime) }}</el-text>
          </div>
          <div
            class="relative flex flex-col break-words bg-[var(--el-fill-color-light)] shadow-[0_0_0_1px_var(--el-border-color-light)] rounded-10px pt-10px px-10px pb-5px"
            ref="markdownViewRef"
          >
            <MessageReasoning
              :reasoning-content="item.reasoningContent || ''"
              :content="item.content || ''"
            />
            <MarkdownView
              class="text-[var(--el-text-color-primary)] text-[0.95rem]"
              :content="item.content"
            />
            <MessageFiles :attachment-urls="item.attachmentUrls" />
            <MessageKnowledge v-if="item.segments" :segments="item.segments" />
            <MessageWebSearch v-if="item.webSearchPages" :web-search-pages="item.webSearchPages" />
          </div>
          <div class="flex flex-row mt-8px">
            <el-button
              class="flex bg-transparent items-center hover:cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
              link
              @click="copyContent(item.content)"
            >
              <img class="h-20px" src="@/assets/ai/copy.svg" />
            </el-button>
            <el-button
              v-if="item.id > 0"
              class="flex bg-transparent items-center hover:cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
              link
              @click="onDelete(item.id)"
            >
              <img class="h-17px" src="@/assets/ai/delete.svg" />
            </el-button>
          </div>
        </div>
      </div>
      <!-- 靠右 message：user 类型 -->
      <div class="flex flex-row-reverse justify-start mt-50px" v-if="item.type === 'user'">
        <div class="avatar">
          <el-avatar :src="userAvatar" />
        </div>
        <div class="flex flex-col text-left mx-15px">
          <div>
            <el-text class="text-left leading-30px">{{ formatDate(item.createTime) }}</el-text>
          </div>
          <!-- 附件显示行 -->
          <div
            v-if="item.attachmentUrls && item.attachmentUrls.length > 0"
            class="flex flex-row-reverse mb-8px"
          >
            <MessageFiles :attachment-urls="item.attachmentUrls" />
          </div>
          <!-- 文本内容行 -->
          <div class="flex flex-row-reverse">
            <div
              v-if="item.content && item.content.trim()"
              class="text-[0.95rem] text-[var(--el-color-white)] inline bg-[var(--el-color-primary)] shadow-[0_0_0_1px_var(--el-color-primary)] rounded-10px p-10px w-auto break-words whitespace-pre-wrap"
            >
              {{ item.content }}
            </div>
          </div>
          <div class="flex flex-row-reverse mt-8px">
            <el-button
              class="flex bg-transparent items-center hover:cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
              link
              @click="copyContent(item.content)"
            >
              <img class="h-20px" src="@/assets/ai/copy.svg" />
            </el-button>
            <el-button
              class="flex bg-transparent items-center hover:cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
              link
              @click="onDelete(item.id)"
            >
              <img class="h-17px mr-12px" src="@/assets/ai/delete.svg" />
            </el-button>
            <el-button
              class="flex bg-transparent items-center hover:cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
              link
              @click="onRefresh(item)"
            >
              <el-icon size="17"><RefreshRight /></el-icon>
            </el-button>
            <el-button
              class="flex bg-transparent items-center hover:cursor-pointer hover:bg-[var(--el-fill-color-lighter)]"
              link
              @click="onEdit(item)"
            >
              <el-icon size="17"><Edit /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 回到底部 -->
  <div v-if="isScrolling" class="absolute z-1000 bottom-0 right-50%" @click="handleGoBottom">
    <el-button :icon="ArrowDownBold" circle />
  </div>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { formatDate } from '@/utils/formatTime'
import MarkdownView from '@/components/MarkdownView/index.vue'
import MessageKnowledge from './MessageKnowledge.vue'
import MessageReasoning from './MessageReasoning.vue'
import MessageFiles from './MessageFiles.vue'
import MessageWebSearch from './MessageWebSearch.vue'
import { useClipboard } from '@vueuse/core'
import { ArrowDownBold, Edit, RefreshRight } from '@element-plus/icons-vue'
import { ChatMessageApi, ChatMessageVO } from '@/api/ai/chat/message'
import { ChatConversationVO } from '@/api/ai/chat/conversation'
import { useUserStore } from '@/store/modules/user'
import userAvatarDefaultImg from '@/assets/imgs/avatar.gif'
import roleAvatarDefaultImg from '@/assets/ai/gpt.svg'

const message = useMessage() // 消息弹窗
const { copy } = useClipboard() // 初始化 copy 到粘贴板
const userStore = useUserStore()

// 判断“消息列表”滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null)
const isScrolling = ref(false) //用于判断用户是否在滚动

const userAvatar = computed(() => userStore.user.avatar || userAvatarDefaultImg)
const roleAvatar = computed(() => props.conversation.roleAvatar ?? roleAvatarDefaultImg)

// 定义 props
const props = defineProps({
  conversation: {
    type: Object as PropType<ChatConversationVO>,
    required: true
  },
  list: {
    type: Array as PropType<ChatMessageVO[]>,
    required: true
  }
})

const { list } = toRefs(props) // 消息列表

const emits = defineEmits(['onDeleteSuccess', 'onRefresh', 'onEdit']) // 定义 emits

// ============ 处理对话滚动 ==============

/** 滚动到底部 */
const scrollToBottom = async (isIgnore?: boolean) => {
  // 注意要使用 nextTick 以免获取不到 dom
  await nextTick()
  if (isIgnore || !isScrolling.value) {
    messageContainer.value.scrollTop =
      messageContainer.value.scrollHeight - messageContainer.value.offsetHeight
  }
}

function handleScroll() {
  const scrollContainer = messageContainer.value
  const scrollTop = scrollContainer.scrollTop
  const scrollHeight = scrollContainer.scrollHeight
  const offsetHeight = scrollContainer.offsetHeight
  if (scrollTop + offsetHeight < scrollHeight - 100) {
    // 用户开始滚动并在最底部之上，取消保持在最底部的效果
    isScrolling.value = true
  } else {
    // 用户停止滚动并滚动到最底部，开启保持到最底部的效果
    isScrolling.value = false
  }
}

/** 回到底部 */
const handleGoBottom = async () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTop = scrollContainer.scrollHeight
}

/** 回到顶部 */
const handlerGoTop = async () => {
  const scrollContainer = messageContainer.value
  scrollContainer.scrollTop = 0
}

defineExpose({ scrollToBottom, handlerGoTop }) // 提供方法给 parent 调用

// ============ 处理消息操作 ==============

/** 复制 */
const copyContent = async (content: string) => {
  await copy(content)
  message.success('复制成功！')
}

/** 删除 */
const onDelete = async (id) => {
  // 删除 message
  await ChatMessageApi.deleteChatMessage(id)
  message.success('删除成功！')
  // 回调
  emits('onDeleteSuccess')
}

/** 刷新 */
const onRefresh = async (message: ChatMessageVO) => {
  emits('onRefresh', message)
}

/** 编辑 */
const onEdit = async (message: ChatMessageVO) => {
  emits('onEdit', message)
}

/** 初始化 */
onMounted(async () => {
  messageContainer.value.addEventListener('scroll', handleScroll)
})
</script>
