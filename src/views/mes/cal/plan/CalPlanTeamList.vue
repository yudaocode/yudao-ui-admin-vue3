<!-- MES 排班计划-班组 列表（左：班组表格，右：成员预览） -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button
      v-if="!readonly"
      type="primary"
      plain
      size="small"
      @click="openForm('create')"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加班组
    </el-button>
    <!-- DONE @AI：左边：班组；右边：成员 -->
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
          <el-table-column v-if="!readonly" label="操作" align="center" width="80">
            <template #default="scope">
              <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>
      <!-- DONE @AI：右边：成员；（后端接口已有 /mes/cal/team-member/list-by-team） -->
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
          <div v-if="selectedTeamId && !memberLoading && memberList.length === 0" class="member-empty-tip">
            <el-empty description="暂无成员" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
        <el-form-item label="班组" prop="teamId">
          <el-select v-model="formData.teamId" placeholder="请选择班组" class="!w-1/1">
            <el-option
              v-for="team in teamList"
              :key="team.id"
              :label="team.name"
              :value="team.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { CalPlanTeamApi, CalPlanTeamVO } from '@/api/mes/cal/plan/team'
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'
import { CalTeamMemberApi, CalTeamMemberVO } from '@/api/mes/cal/team/member'

defineOptions({ name: 'CalPlanTeamList' })

const props = defineProps<{
  planId: number // 排班计划编号
  readonly?: boolean // 是否只读模式 TODO @AI：【听我的】，参考别的模块，基于 formType 做判断；你参考下；
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<CalPlanTeamVO[]>([]) // 列表的数据
const teamList = ref<CalTeamVO[]>([]) // 班组下拉列表

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

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  planId: undefined as number | undefined,
  teamId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  teamId: [{ required: true, message: '班组不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = async (type: string) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  resetForm()
  // 加载班组下拉列表
  teamList.value = await CalTeamApi.getTeamList()
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as CalPlanTeamVO
    await CalPlanTeamApi.createPlanTeam(data)
    message.success(t('common.createSuccess'))
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    planId: props.planId,
    teamId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
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
