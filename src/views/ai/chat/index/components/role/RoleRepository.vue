<!-- chat 角色仓库 -->
<template>
  <el-container class="role-container">
    <ChatRoleForm ref="formRef" @success="handlerAddRoleSuccess" />
    <!-- header  -->
    <RoleHeader title="角色仓库" class="relative" />
    <!--  main  -->
    <el-main class="role-main">
      <div class="search-container">
        <!-- 搜索按钮 -->
        <el-input
          :loading="loading"
          v-model="search"
          class="search-input"
          size="default"
          placeholder="请输入搜索的内容"
          :suffix-icon="Search"
          @change="getActiveTabsRole"
        />
        <el-button
          v-if="activeTab == 'my-role'"
          type="primary"
          @click="handlerAddRole"
          class="ml-20px"
        >
          <Icon icon="ep:user" style="margin-right: 5px" />
          添加角色
        </el-button>
      </div>
      <!-- tabs -->
      <el-tabs v-model="activeTab" class="tabs" @tab-click="handleTabsClick">
        <el-tab-pane class="role-pane" label="我的角色" name="my-role">
          <RoleList
            :loading="loading"
            :role-list="myRoleList"
            :show-more="true"
            @on-delete="handlerCardDelete"
            @on-edit="handlerCardEdit"
            @on-use="handlerCardUse"
            @on-page="handlerCardPage('my')"
            class="mt-20px"
          />
        </el-tab-pane>
        <el-tab-pane label="公共角色" name="public-role">
          <RoleCategoryList
            class="role-category-list"
            :category-list="categoryList"
            :active="activeCategory"
            @on-category-click="handlerCategoryClick"
          />
          <RoleList
            :role-list="publicRoleList"
            @on-delete="handlerCardDelete"
            @on-edit="handlerCardEdit"
            @on-use="handlerCardUse"
            @on-page="handlerCardPage('public')"
            class="mt-20px"
            loading
          />
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RoleHeader from './RoleHeader.vue'
import RoleList from './RoleList.vue'
import ChatRoleForm from '@/views/ai/model/chatRole/ChatRoleForm.vue'
import RoleCategoryList from './RoleCategoryList.vue'
import { ChatRoleApi, ChatRolePageReqVO, ChatRoleVO } from '@/api/ai/model/chatRole'
import { ChatConversationApi, ChatConversationVO } from '@/api/ai/chat/conversation'
import { Search } from '@element-plus/icons-vue'
import { TabsPaneContext } from 'element-plus'

const router = useRouter() // 路由对象

// 属性定义
const loading = ref<boolean>(false) // 加载中
const activeTab = ref<string>('my-role') // 选中的角色 Tab
const search = ref<string>('') // 加载中
const myRoleParams = reactive({
  pageNo: 1,
  pageSize: 50
})
const myRoleList = ref<ChatRoleVO[]>([]) // my 分页大小
const publicRoleParams = reactive({
  pageNo: 1,
  pageSize: 50
})
const publicRoleList = ref<ChatRoleVO[]>([]) // public 分页大小
const activeCategory = ref<string>('全部') // 选择中的分类
const categoryList = ref<string[]>([]) // 角色分类类别

/** tabs 点击 */
const handleTabsClick = async (tab: TabsPaneContext) => {
  // 设置切换状态
  activeTab.value = tab.paneName + ''
  // 切换的时候重新加载数据
  await getActiveTabsRole()
}

/** 获取 my role 我的角色 */
const getMyRole = async (append?: boolean) => {
  const params: ChatRolePageReqVO = {
    ...myRoleParams,
    name: search.value,
    publicStatus: false
  }
  const { list } = await ChatRoleApi.getMyPage(params)
  if (append) {
    myRoleList.value.push.apply(myRoleList.value, list)
  } else {
    myRoleList.value = list
  }
}

/** 获取 public role 公共角色 */
const getPublicRole = async (append?: boolean) => {
  const params: ChatRolePageReqVO = {
    ...publicRoleParams,
    category: activeCategory.value === '全部' ? '' : activeCategory.value,
    name: search.value,
    publicStatus: true
  }
  const { total, list } = await ChatRoleApi.getMyPage(params)
  if (append) {
    publicRoleList.value.push.apply(publicRoleList.value, list)
  } else {
    publicRoleList.value = list
  }
}

/** 获取选中的 tabs 角色 */
const getActiveTabsRole = async () => {
  if (activeTab.value === 'my-role') {
    myRoleParams.pageNo = 1
    await getMyRole()
  } else {
    publicRoleParams.pageNo = 1
    await getPublicRole()
  }
}

/** 获取角色分类列表 */
const getRoleCategoryList = async () => {
  categoryList.value = ['全部', ...(await ChatRoleApi.getCategoryList())]
}

/** 处理分类点击 */
const handlerCategoryClick = async (category: string) => {
  // 切换选择的分类
  activeCategory.value = category
  // 筛选
  await getActiveTabsRole()
}

/** 添加/修改操作 */
const formRef = ref()
const handlerAddRole = async () => {
  formRef.value.open('my-create', null, '添加角色')
}
/** 编辑角色 */
const handlerCardEdit = async (role) => {
  formRef.value.open('my-update', role.id, '编辑角色')
}

/** 添加角色成功 */
const handlerAddRoleSuccess = async (e) => {
  // 刷新数据
  await getActiveTabsRole()
}

/** 删除角色 */
const handlerCardDelete = async (role) => {
  await ChatRoleApi.deleteMy(role.id)
  // 刷新数据
  await getActiveTabsRole()
}

/** 角色分页：获取下一页 */
const handlerCardPage = async (type) => {
  try {
    loading.value = true
    if (type === 'public') {
      publicRoleParams.pageNo++
      await getPublicRole(true)
    } else {
      myRoleParams.pageNo++
      await getMyRole(true)
    }
  } finally {
    loading.value = false
  }
}

/** 选择 card 角色：新建聊天对话 */
const handlerCardUse = async (role) => {
  // 1. 创建对话
  const data: ChatConversationVO = {
    roleId: role.id
  } as unknown as ChatConversationVO
  const conversationId = await ChatConversationApi.createChatConversationMy(data)

  // 2. 跳转页面
  await router.push({
    name: 'AiChat',
    query: {
      conversationId: conversationId
    }
  })
}

/** 初始化 **/
onMounted(async () => {
  // 获取分类
  await getRoleCategoryList()
  // 获取 role 数据
  await getActiveTabsRole()
})
</script>
<!-- 覆盖 element ui css -->
<style lang="scss">
.el-tabs__content {
  position: relative;
  height: 100%;
  overflow: hidden;
}
.el-tabs__nav-scroll {
  margin: 10px 20px;
}
</style>
<!-- 样式 -->
<style scoped lang="scss">
// 跟容器
.role-container {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: var(--el-bg-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .role-main {
    flex: 1;
    overflow: hidden;
    margin: 0;
    padding: 0;
    position: relative;

    .search-container {
      margin: 20px 20px 0px 20px;
      position: absolute;
      right: 0;
      top: -5px;
      z-index: 100;
    }

    .search-input {
      width: 240px;
    }

    .tabs {
      position: relative;
      height: 100%;

      .role-category-list {
        margin: 0 27px;
      }
    }

    .role-pane {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      position: relative;
    }
  }
}
</style>
