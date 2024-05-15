<!-- chat 角色仓库 -->
<template>
  <el-container class="role-container">
    <ChatRoleForm  ref="formRef" @success="handlerAddRoleSuccess"  />

    <Header title="角色仓库"/>
    <el-main class="role-main">
      <div class="search-container">
        <!-- 搜索按钮 -->
        <el-input
          v-model="search"
          class="search-input"
          size="default"
          placeholder="请输入搜索的内容"
          :suffix-icon="Search"
          @change="getActiveTabsRole"
        />
        <el-button type="primary" @click="handlerAddRole" style="margin-left: 20px;">
          <el-icon><User /></el-icon>
          添加角色
        </el-button>
      </div>
      <!-- tabs -->
      <el-tabs v-model="activeRole" class="tabs" @tab-click="handleTabsClick">
        <el-tab-pane class="role-pane" label="我的角色" name="my-role">
          <RoleList :role-list="myRoleList" @onDelete="handlerCardDelete" @onEdit="handlerCardEdit" style="margin-top: 20px;" />
        </el-tab-pane>
        <el-tab-pane label="公共角色" name="public-role">
          <RoleCategoryList :category-list="categoryList" :active="activeCategory" @onCategoryClick="handlerCategoryClick" />
          <RoleList :role-list="publicRoleList" @onDelete="handlerCardDelete" @onEdit="handlerCardEdit" style="margin-top: 20px;" />
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
import {TabsPaneContext} from "element-plus";
import {Search, User} from "@element-plus/icons-vue";

// 属性定义
const activeRole = ref<string>('my-role') // 选中的角色
const loadding = ref<boolean>(true) // 加载中
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
const getMyRole = async () => {
  const params:ChatRolePageReqVO = {
    pageNo: myPageNo.value,
    pageSize: myPageSize.value,
    category: activeCategory.value,
    name: search.value,
    publicStatus: false
  }
  const { total, list } = await ChatRoleApi.getMyPage(params)
  myRoleList.value = list
}

// 获取 public role
const getPublicRole = async () => {
  const params:ChatRolePageReqVO = {
    pageNo: publicPageNo.value,
    pageSize: publicPageSize.value,
    category: activeCategory.value,
    name: search.value,
    publicStatus: true
  }
  const { total, list } = await ChatRoleApi.getMyPage(params)
  publicRoleList.value = list
}

// 获取选中的 tabs 角色
const getActiveTabsRole = async () => {
  if (activeRole.value === 'my-role') {
    await getMyRole()
  } else {
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

// 添加角色成功
const handlerAddRoleSuccess = async  (e) => {
  console.log(e)
  // 刷新数据
  await getActiveTabsRole()
}


//
onMounted( async () => {
  // 获取分类
  await getRoleCategoryList()
  // 获取 role 数据
  await getActiveTabsRole()
})
</script>
<!-- 样式 -->
<style scoped lang="scss">

// 跟容器
.role-container {
  position: absolute;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #ffffff;

  display: flex;
  flex-direction: column;

  .role-main {
    position: relative;

    .search-container {
      position: absolute;
      right: 20px;
      top: 10px;
      z-index: 100;
    }

    .search-input {
      width: 240px;
    }

    .tabs {
      position: relative;
    }

    .role-pane {
      display: flex;
      flex-direction: column;
    }
  }
}


</style>
