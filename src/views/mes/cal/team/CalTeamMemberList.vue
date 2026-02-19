<template>
  <div>
    <el-button type="primary" plain size="small" @click="openForm()" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加成员
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="用户编号" align="center" prop="userId" width="100" />
      <el-table-column label="用户昵称" align="center" prop="nickname" min-width="120" />
      <el-table-column label="手机号" align="center" prop="telephone" min-width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <CalTeamMemberForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { CalTeamMemberApi, CalTeamMemberVO } from '@/api/mes/cal/team/member'
import { getSimpleUserList } from '@/api/system/user'
import type { UserVO } from '@/api/system/user'

const props = defineProps<{
  teamId: number // 班组编号
}>()

const message = useMessage()

const loading = ref(false)
const list = ref<CalTeamMemberVO[]>([])
const formRef = ref<InstanceType<typeof CalTeamMemberForm>>()

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await CalTeamMemberApi.getTeamMemberListByTeam(props.teamId)
  } finally {
    loading.value = false
  }
}

/** 打开添加弹窗 */
const openForm = () => {
  formRef.value?.open(props.teamId)
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CalTeamMemberApi.deleteTeamMember(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

watch(
  () => props.teamId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>
