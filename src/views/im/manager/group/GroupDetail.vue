<template>
  <el-drawer v-model="drawerVisible" title="群详情" size="900px" :destroy-on-close="true">
    <!-- 群基本信息 -->
    <el-descriptions :column="2" border>
      <el-descriptions-item label="群编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="群名称">{{ detail.name }}</el-descriptions-item>
      <el-descriptions-item label="头像">
        <el-avatar :src="detail.avatar" :size="36">
          {{ detail.name?.charAt(0) ?? '?' }}
        </el-avatar>
      </el-descriptions-item>
      <el-descriptions-item label="群主">
        {{ detail.ownerNickname || '-' }} ({{ detail.ownerUserId }})
      </el-descriptions-item>
      <el-descriptions-item label="成员数">{{ detail.memberCount ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="群状态">
        <dict-tag :type="DICT_TYPE.IM_GROUP_STATUS" :value="detail.status" />
      </el-descriptions-item>
      <el-descriptions-item label="封禁状态">
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detail.banned" />
        <span v-if="detail.banned" class="ml-5px text-gray-400">{{ detail.bannedReason }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="全群禁言">
        <el-tag v-if="detail.mutedAll" type="danger">已禁言</el-tag>
        <el-tag v-else type="info">未禁言</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="群公告" :span="2">{{
        detail.notice || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="创建时间" :span="2">
        {{ formatDate(detail.createTime) }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- 群成员列表 -->
    <div class="mt-20px mb-15px flex items-center justify-between">
      <span class="font-bold">群成员</span>
      <el-checkbox v-model="activeOnly">仅展示当前群内的成员</el-checkbox>
    </div>
    <el-table v-loading="loading" :data="filteredMembers" border>
      <el-table-column label="头像" width="80" align="center">
        <template #default="{ row }">
          <el-avatar :src="row.avatar" :size="40">
            {{ row.nickname?.charAt(0) ?? '?' }}
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column label="用户编号" prop="userId" width="100" align="center" />
      <el-table-column label="角色" prop="role" width="100" align="center">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IM_GROUP_MEMBER_ROLE" :value="row.role" />
        </template>
      </el-table-column>
      <el-table-column label="昵称" prop="nickname" min-width="120" show-overflow-tooltip />
      <el-table-column
        label="组内显示名"
        prop="displayUserName"
        min-width="120"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.displayUserName || '-' }}</template>
      </el-table-column>
      <el-table-column label="群备注" prop="groupRemark" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.groupRemark || '-' }}</template>
      </el-table-column>
      <el-table-column label="免打扰" prop="silent" width="80" align="center">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.silent" />
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="100" align="center">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="入群时间"
        prop="joinTime"
        width="170"
        align="center"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="退群时间"
        prop="quitTime"
        width="170"
        align="center"
        :formatter="dateFormatter"
      />
      <el-table-column label="禁言状态" width="170" align="center">
        <template #default="{ row }">
          <template v-if="row.muteEndTime && new Date(row.muteEndTime) > new Date()">
            <el-tag type="danger">禁言中</el-tag>
            <div class="text-xs text-gray-400 mt-2px">{{ formatDate(row.muteEndTime) }}</div>
          </template>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script lang="ts" setup>
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as ManagerGroupApi from '@/api/im/manager/group'

defineOptions({ name: 'ImGroupDetail' })

const drawerVisible = ref(false) // 抽屉的显示
const detail = ref<ManagerGroupApi.ImManagerGroupVO>({} as ManagerGroupApi.ImManagerGroupVO) // 群详情数据
const loading = ref(false) // 成员列表的加载中
const memberList = ref<ManagerGroupApi.ImManagerGroupMemberVO[]>([]) // 群成员列表（含已退群）
const activeOnly = ref(true) // 仅展示当前群内的成员

/** 当前展示的群成员（按 activeOnly 前端过滤） */
const filteredMembers = computed(() =>
  activeOnly.value
    ? memberList.value.filter((m) => m.status === CommonStatusEnum.ENABLE)
    : memberList.value
)

/** 打开详情，加载群成员 */
const open = async (row: ManagerGroupApi.ImManagerGroupVO) => {
  detail.value = row
  drawerVisible.value = true
  activeOnly.value = true
  loading.value = true
  try {
    memberList.value = await ManagerGroupApi.getManagerGroupMemberList(row.id)
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
