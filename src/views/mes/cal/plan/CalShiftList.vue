<!-- MES 排班计划-班次 列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button
      v-if="!isDetail"
      type="primary"
      plain
      size="small"
      @click="openForm('create')"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加班次
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="顺序" align="center" prop="sort" width="80" />
      <el-table-column label="班次名称" align="center" prop="name" min-width="120" />
      <el-table-column label="开始时间" align="center" prop="startTime" width="100" />
      <el-table-column label="结束时间" align="center" prop="endTime" width="100" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column v-if="!isDetail" label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
        <el-form-item label="顺序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="1"
            controls-position="right"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="班次名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入班次名称" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="formData.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="请选择开始时间"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="formData.endTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="请选择结束时间"
            class="!w-1/1"
          />
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
import { CalPlanShiftApi, CalPlanShiftVO } from '@/api/mes/cal/plan/shift'

defineOptions({ name: 'CalShiftList' })

const props = defineProps<{
  planId: number // 排班计划编号
  formType: string // 表单的类型：create / update / detail
}>()

const isDetail = computed(() => props.formType === 'detail') // DONE @AI：【听我的】，参考别的模块，基于 formType 做判断；你参考下；

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const loading = ref(false) // 列表的加载中
const list = ref<CalPlanShiftVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await CalPlanShiftApi.getPlanShiftListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const dialogType = ref('') // 表单的类型：create - 新增；update - 修改
const formLoading = ref(false) // 表单的加载中
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  planId: undefined as number | undefined,
  sort: 1,
  name: undefined as string | undefined,
  startTime: undefined as string | undefined,
  endTime: undefined as string | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  sort: [{ required: true, message: '顺序不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '班次名称不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'blur' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = (type: string, row?: CalPlanShiftVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  dialogType.value = type
  resetForm()
  // 修改时，设置数据
  if (type === 'update' && row) {
    formData.value = {
      id: row.id,
      planId: row.planId,
      sort: row.sort,
      name: row.name,
      startTime: row.startTime,
      endTime: row.endTime,
      remark: row.remark
    }
  }
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
    const data = formData.value as unknown as CalPlanShiftVO
    if (dialogType.value === 'create') {
      await CalPlanShiftApi.createPlanShift(data)
      message.success(t('common.createSuccess'))
    } else {
      await CalPlanShiftApi.updatePlanShift(data)
      message.success(t('common.updateSuccess'))
    }
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
    sort: 1,
    name: undefined,
    startTime: undefined,
    endTime: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CalPlanShiftApi.deletePlanShift(id)
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
