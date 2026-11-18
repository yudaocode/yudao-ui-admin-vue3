<!-- AI 短剧：项目列表、公开广场；新建、编辑项目跳转到独立路由的项目表单 -->
<template>
  <doc-alert title="AI 短剧制作" url="https://doc.iocoder.cn/ai/drama/" />

  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="我的项目" name="my" />
      <el-tab-pane label="公开广场" name="public" />
    </el-tabs>
    <!-- 「新建项目」在我的项目的查询操作区，与芋道其它列表的新增入口一致 -->
    <MyList v-show="activeTab === 'my'" ref="myListRef" @edit="openForm" @create="openForm()" />
    <PublicList v-show="activeTab === 'public'" ref="publicListRef" />
  </ContentWrap>
</template>

<script setup lang="ts">
import MyList from './components/MyList.vue'
import PublicList from './components/PublicList.vue'

/** AI 短剧：项目列表 */
defineOptions({ name: 'AiDrama' })

const { push } = useRouter() // 路由

const activeTab = ref('my')
const myListRef = ref() // 我的项目
const publicListRef = ref() // 公开广场

/** 新建、编辑项目：同一个独立路由的项目表单，可刷新、返回 */
const openForm = (id?: number) => {
  if (id) {
    push({ name: 'AiDramaProject', params: { id } })
  } else {
    push({ name: 'AiDramaProjectCreate' })
  }
}

/** 切换页签：加载对应列表 */
const handleTabChange = () => {
  if (activeTab.value === 'my') {
    myListRef.value.getList()
  } else {
    publicListRef.value.getList()
  }
}

/** 初始化；从项目表单返回时，刷新当前列表 **/
onActivated(() => {
  handleTabChange()
})
</script>
