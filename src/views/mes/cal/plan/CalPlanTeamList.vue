<!-- MES 排班计划-班组 列表（左：班组表格，右：成员预览） -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button
      v-if="!isDetail"
      type="primary"
      plain
      size="small"
      @click="openTeamSelect"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加班组
    </el-button>
    <el-row :gutter="20">
      <!-- 左侧：班组列表 -->
      <el-col :span="14">
        <el-table
          v-loading="loading"
          :data="list"
          :stripe="true"
          :show-overflow-tooltip="true"
          border
          highlight-current-row
          @current-change="handleTeamSelect"
        >
          <el-table-column label="班组编号" align="center" prop="teamId" width="100" />
          <el-table-column label="班组编码" align="center" prop="teamCode" min-width="100" />
          <el-table-column label="班组名称" align="center" prop="teamName" min-width="100" />
          <el-table-column label="备注" align="center" prop="remark" min-width="120" />
          <el-table-column v-if="!isDetail" label="操作" align="center" width="80">
            <template #default="scope">
              <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
      <!-- 右侧：成员预览 -->
      <el-col :span="10">
        <el-card shadow="never" class="member-card">
          <template #header>
            <div class="member-card-header">
              <span>{{ selectedTeamName ? `「${selectedTeamName}」班组成员` : '班组成员' }}</span>
            </div>
          </template>
          <div v-if="!selectedTeamId" class="member-empty-tip">
            <el-empty description="请点击左侧班组查看成员" :image-size="60" />
          </div>
          <el-table
            v-else
            v-loading="memberLoading"
            :data="memberList"
            :stripe="true"
            :show-overflow-tooltip="true"
            border
            size="small"
          >
            <el-table-column label="用户昵称" align="center" prop="nickname" min-width="100" />
            <el-table-column label="手机号" align="center" prop="telephone" min-width="120" />
            <el-table-column label="备注" align="center" prop="remark" min-width="100" />
          </el-table>
          <div
            v-if="selectedTeamId && !memberLoading && memberList.length === 0"
            class="member-empty-tip"
          >
            <el-empty description="暂无成员" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 班组多选弹窗 -->
    <CalTeamSelectDialog ref="teamDialogRef" :multiple="true" @selected="handleTeamsSelected" />
  </div>
</template>

<script setup lang="ts">
import { CalPlanTeamApi, CalPlanTeamVO } from '@/api/mes/cal/plan/team'
import { CalTeamMemberApi, CalTeamMemberVO } from '@/api/mes/cal/team/member'
import { CalTeamVO } from '@/api/mes/cal/team'
import CalTeamSelectDialog from '@/views/mes/cal/team/components/CalTeamSelectDialog.vue'

defineOptions({ name: 'CalPlanTeamList' })

const props = defineProps<{
  planId: number // 排班计划编号
  formType: string // 表单的类型：create / update / detail
}>()

const isDetail = computed(() => props.formType === 'detail') // DONE @AI：【听我的】，参考别的模块，基于 formType 做判断；你参考下；

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<CalPlanTeamVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await CalPlanTeamApi.getPlanTeamListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

// ==================== 成员预览 ====================
const selectedTeamId = ref<number>() // 当前选中的班组编号
const selectedTeamName = ref('') // 当前选中的班组名称
const memberLoading = ref(false) // 成员列表的加载中
const memberList = ref<CalTeamMemberVO[]>([]) // 成员列表的数据

/** 点击班组行，加载成员列表 */
const handleTeamSelect = async (row: CalPlanTeamVO | null) => {
  if (!row) {
    selectedTeamId.value = undefined
    selectedTeamName.value = ''
    memberList.value = []
    return
  }
  selectedTeamId.value = row.teamId
  selectedTeamName.value = row.teamName || ''
  memberLoading.value = true
  try {
    memberList.value = await CalTeamMemberApi.getTeamMemberListByTeam(row.teamId)
  } finally {
    memberLoading.value = false
  }
}

// ==================== 多选班组批量添加 ====================
const teamDialogRef = ref()

/** 打开班组多选弹窗 */
const openTeamSelect = () => {
  // 传入已关联的班组 ID 列表，方便高亮已选
  const existingTeamIds = list.value.map((item) => item.teamId)
  teamDialogRef.value.open(existingTeamIds)
}

/** 多选班组确认后，批量创建关联 */
const handleTeamsSelected = async (rows: CalTeamVO[]) => {
  if (!rows || rows.length === 0) {
    return
  }
  // 过滤掉已经存在的班组
  const existingTeamIds = new Set(list.value.map((item) => item.teamId))
  const newTeams = rows.filter((team) => !existingTeamIds.has(team.id))
  if (newTeams.length === 0) {
    message.warning('所选班组已全部添加过')
    return
  }
  // 逐个创建（后端为单条创建接口）
  loading.value = true
  try {
    for (const team of newTeams) {
      await CalPlanTeamApi.createPlanTeam({
        planId: props.planId,
        teamId: team.id
      } as unknown as CalPlanTeamVO)
    }
    message.success(`成功添加 ${newTeams.length} 个班组`)
    await getList()
  } finally {
    loading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CalPlanTeamApi.deletePlanTeam(id)
    message.success('删除成功')
    // 如果删除的是当前选中的班组，清空成员预览
    const deletedItem = list.value.find((item) => item.id === id)
    if (deletedItem && deletedItem.teamId === selectedTeamId.value) {
      selectedTeamId.value = undefined
      selectedTeamName.value = ''
      memberList.value = []
    }
    await getList()
  } catch {}
}

/** 监听 planId 变化，加载列表 */
watch(
  () => props.planId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.member-card {
  height: 100%;
}

.member-card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
}

.member-empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}
</style>
