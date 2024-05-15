<!-- chat 角色仓库 -->
<template>
  <el-container class="role-container">
    <Header title="角色仓库"/>
    <el-main class="role-main">
      <el-tabs v-model="activeRole" class="demo-tabs" @tab-click="handleTabsClick">
        <el-tab-pane label="我的角色" name="my-role">
          <RoleList :role-list="myRoleList" />
        </el-tab-pane>
        <el-tab-pane label="公共角色" name="public-role">
          <RoleList :role-list="publicRoleList" />
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
import {ChatRoleApi, ChatRolePageReqVO, ChatRoleVO} from '@/api/ai/model/chatRole'
import {TabsPaneContext} from "element-plus";

// 属性定义
const activeRole = ref<string>('my-role') // 选中的角色
const loadding = ref<boolean>(true) // 加载中
const myPageNo = ref<number>(1) // my 分页下标
const myPageSize = ref<number>(50) // my 分页大小
const myRoleList = ref<ChatRoleVO[]>([]) // my 分页大小
const publicPageNo = ref<number>(1) // public 分页下标
const publicPageSize = ref<number>(50) // public 分页大小
const publicRoleList = ref<ChatRoleVO[]>([]) // public 分页大小

// tabs 点击
const handleTabsClick = async (tab: TabsPaneContext) => {
  // 设置切换状态
  const activeTabs = tab.paneName + ''
  activeRole.value = activeTabs;
  // 切换的时候重新加载数据
  await getActiveTabsRole()
}

// 获取 my role
const getMyRole = async (pageNo: number, pageSize: number) => {
  const params:ChatRolePageReqVO = {
    pageNo,
    pageSize,
    publicStatus: false
  }
  const { total, list } = await ChatRoleApi.getMyRole(params)
  myRoleList.value = list
  console.log('myRoleList 获取成功', list)
  console.log('myRoleList 获取成功', myRoleList.value)
}

// 获取 public role
const getPublicRole = async (pageNo: number, pageSize: number) => {
  const params:ChatRolePageReqVO = {
    pageNo,
    pageSize,
    publicStatus: true
  }
  const { total, list } = await ChatRoleApi.getMyRole(params)
  console.log(list)
  publicRoleList.value = list
}

// 获取选中的 tabs 角色
const getActiveTabsRole = async () => {
  if (activeRole.value === 'my-role') {
    await getMyRole(myPageNo.value, myPageSize.value)
  } else {
    await getPublicRole(myPageNo.value, myPageSize.value)
  }
}

//
onMounted( async () => {
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

  }
}


</style>
