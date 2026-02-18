<!-- TODO @芋艿：暂未 review -->
<template>
  <div>
    <el-button type="primary" plain size="small" @click="openForm()" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加成员
    </el-button>
    <!-- TODO @AI：这里展示的时候，没去读取相关字段，可能后端接口，需要修复下； -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="用户编号" align="center" prop="userId" width="100" />
      <el-table-column label="用户名称" align="center" prop="userName" min-width="120" />
      <el-table-column label="用户昵称" align="center" prop="nickname" min-width="120" />
      <el-table-column label="手机号" align="center" prop="telephone" min-width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加成员弹窗 -->
    <!-- TODO @AI：拆分成一个 List，一个 Form； -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
        <!-- TODO @AI：用户下拉选择； -->
        <el-form-item label="用户" prop="userId">
          <el-input-number v-model="formData.userId" placeholder="请输入用户编号" class="!w-1/1" />
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
import { CalTeamMemberApi, CalTeamMemberVO } from '@/api/mes/cal/team/member'

const props = defineProps<{
  teamId: number // 班组编号
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表加载中
const list = ref<CalTeamMemberVO[]>([]) // 成员列表

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await CalTeamMemberApi.getTeamMemberListByTeam(props.teamId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加成员 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的提交加载中
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  teamId: undefined as number | undefined,
  userId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  userId: [{ required: true, message: '用户不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = () => {
  dialogVisible.value = true
  dialogTitle.value = t('action.create')
  resetForm()
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
    const data = formData.value as unknown as CalTeamMemberVO
    await CalTeamMemberApi.createTeamMember(data)
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
    teamId: props.teamId,
    userId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
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
