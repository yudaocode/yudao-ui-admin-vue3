<!-- chat 角色仓库 -->
<template>
  <el-container class="role-container">
    <ChatRoleForm ref="formRef" @success="handlerAddRoleSuccess"/>
    <!--  header  -->
    <Header title="角色仓库" style="position: relative"/>
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
        <el-button type="primary" @click="handlerAddRole" style="margin-left: 20px;">
          <el-icon>
            <User/>
          </el-icon>
          添加角色
        </el-button>
      </div>
      <!-- tabs -->
      <el-tabs v-model="activeRole" class="tabs" @tab-click="handleTabsClick">
        <el-tab-pane class="role-pane" label="我的角色" name="my-role">
          <RoleList
            :loading="loading"
            :role-list="myRoleList"
            :show-more="true"
            @on-delete="handlerCardDelete"
            @on-edit="handlerCardEdit"
            @on-use="handlerCardUse"
            @on-page="handlerCardPage('my')"
            style="margin-top: 20px;"/>
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
            @on-page="handlerCardPage('public')"
            style="margin-top: 20px;"
           loading/>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>

</template>

<!--  setup  -->
<script setup lang="ts">
import {ref} from "vue";
import Header from '@/views/ai/chat/components/Header.vue'
import RoleList from './RoleList.vue'
import ChatRoleForm from '@/views/ai/model/chatRole/ChatRoleForm.vue'
import RoleCategoryList from './RoleCategoryList.vue'
import {ChatRoleApi, ChatRolePageReqVO, ChatRoleVO} from '@/api/ai/model/chatRole'
import {ChatConversationApi, ChatConversationVO} from '@/api/ai/chat/conversation'
import {TabsPaneContext} from "element-plus";
import {Search, User} from "@element-plus/icons-vue";

// 获取路由
const router = useRouter()

// 属性定义
const loading = ref<boolean>(false) // 加载中
const activeRole = ref<string>('my-role') // 选中的角色
const search = ref<string>('') // 加载中
const myPageNo = ref<number>(1) // my 分页下标
const myPageSize = ref<number>(50) // my 分页大小
const myRoleList = ref<ChatRoleVO[]>([]) // my 分页大小
const publicPageNo = ref<number>(1) // public 分页下标
const publicPageSize = ref<number>(50) // public 分页大小
const publicRoleList = ref<ChatRoleVO[]>([]) // public 分页大小
const activeCategory = ref<string>('') // 选择中的分类
const categoryList = ref<string[]>([]) // 角色分类类别
/** 添加/修改操作 */
const formRef = ref()
// tabs 点击
const handleTabsClick = async (tab: TabsPaneContext) => {
  // 设置切换状态
  const activeTabs = tab.paneName + ''
  activeRole.value = activeTabs;
  // 切换的时候重新加载数据
  await getActiveTabsRole()
}

// 获取 my role
const getMyRole = async (append?: boolean) => {
  const params: ChatRolePageReqVO = {
    pageNo: myPageNo.value,
    pageSize: myPageSize.value,
    category: activeCategory.value,
    name: search.value,
    publicStatus: false
  }
  const {total, list} = await ChatRoleApi.getMyPage(params)
  if (append) {
    myRoleList.value.push.apply(myRoleList.value, list)
    console.log('myRoleList.value.push', myRoleList.value)
  } else {
    myRoleList.value = list
  }
}

// 获取 public role
const getPublicRole = async (append?: boolean) => {
  const params: ChatRolePageReqVO = {
    pageNo: publicPageNo.value,
    pageSize: publicPageSize.value,
    category: activeCategory.value,
    name: search.value,
    publicStatus: true
  }
  const {total, list} = await ChatRoleApi.getMyPage(params)
  if (append) {
    publicRoleList.value.push.apply(publicRoleList.value, list)
  } else {
    publicRoleList.value = list
  }
}

// 获取选中的 tabs 角色
const getActiveTabsRole = async () => {
  if (activeRole.value === 'my-role') {
    myPageNo.value = 1
    await getMyRole()
  } else {
    publicPageNo.value = 1
    await getPublicRole()
  }
}

// 获取角色分类列表
const getRoleCategoryList = async () => {
  categoryList.value = await ChatRoleApi.getCategoryList()
}

// 处理分类点击
const handlerCategoryClick = async (category: string) => {
  if (activeCategory.value === category) {
    activeCategory.value = ''
  } else {
    activeCategory.value = category
  }
  await getActiveTabsRole()
}

// 添加角色
const handlerAddRole = async () => {
  formRef.value.open('my-create', null, '添加角色')
}

// card 删除
const handlerCardDelete = async (role) => {
  await ChatRoleApi.deleteMy(role.id)
  // 刷新数据
  await getActiveTabsRole()
}

// card 编辑
const handlerCardEdit = async (role) => {
  formRef.value.open('my-update', role.id, '编辑角色')
}

// card 分页
const handlerCardPage = async (type) => {
  console.log('handlerCardPage', type)
  try {
    loading.value = true
    if (type === 'public') {
      publicPageNo.value++
      await getPublicRole(true)
    } else {
      myPageNo.value++
      await getMyRole(true)
    }
  } finally {
    loading.value = false
  }
}

// card 使用
const handlerCardUse = async (role) => {
  const data: ChatConversationVO = {
    roleId: role.id
  } as unknown as ChatConversationVO
  // 创建对话
  const conversation = await ChatConversationApi.createChatConversationMy(data)
  // 调整页面
  router.push({
    path: `/ai/chat/index`,
    query: {
      conversationId: conversation,
    }
  })
}

// 添加角色成功
const handlerAddRoleSuccess = async (e) => {
  console.log(e)
  // 刷新数据
  await getActiveTabsRole()
}

//
onMounted(async () => {
  // 获取分类
  await getRoleCategoryList()
  // 获取 role 数据
  await getActiveTabsRole()
})
</script>
<style lang="css">

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
  background-color: #ffffff;
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
