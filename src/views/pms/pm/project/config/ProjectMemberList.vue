<template>
  <div>
    <!-- 成员列表标题与操作 -->
    <div class="mb-16px flex items-center justify-between gap-16px">
      <h3 class="m-0 text-18px font-600">项目成员</h3>
      <el-button
        v-if="project.adminStatus && editable"
        v-hasPermi="['pms:pm:project-member:update']"
        type="primary"
        @click="memberFormRef?.open('create', project.id, project.name, memberList)"
      >
        新增成员
      </el-button>
    </div>

    <!-- 成员列表 -->
    <el-table v-loading="loading" :data="memberList">
      <el-table-column label="成员" min-width="200">
        <template #default="scope">
          <div class="flex items-center">
            <el-avatar :size="30" :src="scope.row.avatar">
              {{ scope.row.nickname?.slice(0, 1) }}
            </el-avatar>
            <span class="ml-8px">{{ scope.row.nickname || `用户 #${scope.row.userId}` }}</span>
            <el-tag v-if="scope.row.creatorStatus" class="ml-8px" effect="plain" type="success">
              创建人
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="项目级别" min-width="160">
        <template #default="scope">
          {{ formatProjectMemberLevel(scope.row.level) }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="project.adminStatus && editable"
        align="center"
        fixed="right"
        label="操作"
        width="140"
      >
        <template #default="scope">
          <el-button
            v-hasPermi="['pms:pm:project-member:update']"
            :disabled="scope.row.creatorStatus"
            link
            type="primary"
            @click="memberFormRef?.open('update', project.id, project.name, memberList, scope.row)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['pms:pm:project-member:update']"
            :disabled="scope.row.creatorStatus"
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 成员表单 -->
    <ProjectMemberForm ref="memberFormRef" @success="getMemberList" />
  </div>
</template>

<script lang="ts" setup>
import * as ProjectApi from '@/api/pms/pm/project'
import * as ProjectMemberApi from '@/api/pms/pm/project/member'
import { formatProjectMemberLevel } from '@/views/pms/pm/utils/format'
import ProjectMemberForm from './ProjectMemberForm.vue'

defineOptions({ name: 'PmsProjectMemberList' })

const props = defineProps<{
  project: ProjectApi.PmsProjectVO
  editable: boolean
}>()

const message = useMessage() // 消息弹窗
const loading = ref(false) // 成员列表加载中
const memberList = ref<ProjectMemberApi.PmsProjectMemberVO[]>([]) // 项目成员列表
const memberFormRef = ref<InstanceType<typeof ProjectMemberForm>>() // 项目成员表单 Ref

/** 查询项目成员列表 */
async function getMemberList() {
  loading.value = true
  try {
    memberList.value = await ProjectMemberApi.getProjectMemberList(props.project.id)
  } finally {
    loading.value = false
  }
}

/** 删除项目成员 */
async function handleDelete(member: ProjectMemberApi.PmsProjectMemberVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认将“${member.nickname}”移出项目吗？`)
    // 删除成员并刷新列表
    await ProjectMemberApi.deleteProjectMember(props.project.id, member.userId)
    message.success('成员已移出项目')
    await getMemberList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getMemberList()
})
</script>
