<!-- MES 排班计划-班组 列表 -->
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
    <!-- 列表 -->
    <!-- TODO @AI：左边：班组； -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="班组编号" align="center" prop="teamId" width="120" />
      <el-table-column label="班组编码" align="center" prop="teamCode" min-width="120" />
      <el-table-column label="班组名称" align="center" prop="teamName" min-width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column v-if="!readonly" label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- TODO @AI：右边：成员；（后端接口可以加！！！你加下！！） -->

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

defineOptions({ name: 'CalPlanTeamList' })

const props = defineProps<{
  planId: number // 排班计划编号
  readonly?: boolean // 是否只读模式 DONE @AI：参考别的模块，是不是通过 formType，进一步处理？（当前父组件已通过 isDetail 计算属性传入 readonly，满足需求）
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
