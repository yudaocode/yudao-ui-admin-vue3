<!-- TODO @AI git mv 到 /Users/yunai/Java/yudao-all-in-im/yudao-ui-admin-vue3/src/views/im/manager/group -->
<!-- TODO @AI：需要增加状态；然后有个筛选：仅展示当前群内的成员；和不选中，就是全部； -->
<!-- TODO @AI：displayUserName、displayGroupName、muted；群成员状态；退群时间；需要也展示； -->
<template>
  <el-drawer v-model="drawerVisible" :title="drawerTitle" size="600px" :destroy-on-close="true">
    <el-table v-loading="loading" :data="memberList" border>
      <el-table-column label="头像" width="80" align="center">
        <template #default="{ row }">
          <el-avatar :src="row.avatar" :size="40">
            {{ row.nickname?.charAt(0) ?? '?' }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column label="用户编号" prop="userId" width="120" align="center" />
      <el-table-column label="昵称" prop="nickname" min-width="120" />
      <el-table-column
        label="入群时间"
        prop="joinTime"
        width="180"
        align="center"
        :formatter="dateFormatter"
      />
    </el-table>
  </el-drawer>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as ManagerGroupApi from '@/api/im/manager/group'

defineOptions({ name: 'ImGroupMemberDrawer' })

const drawerVisible = ref(false) // 抽屉的显示
const drawerTitle = ref('群成员列表') // 抽屉的标题
const loading = ref(false) // 列表的加载中
const memberList = ref<ManagerGroupApi.ImManagerGroupMemberVO[]>([]) // 群成员列表

/** 打开抽屉，加载指定群的成员 */
const open = async (groupId: number, groupName?: string) => {
  drawerVisible.value = true
  drawerTitle.value = groupName ? `群成员 - ${groupName}` : '群成员列表'
  loading.value = true
  try {
    memberList.value = await ManagerGroupApi.getManagerGroupMemberList(groupId)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
