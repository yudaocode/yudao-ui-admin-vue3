<!-- MES 工作站-工装夹具 列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-button
      type="primary"
      plain
      size="small"
      @click="openForm('create')"
      class="mb-10px"
      v-if="!isDetail"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加工具
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="工具类型编号" align="center" prop="toolTypeId" />
      <el-table-column label="工具类型名称" align="center" prop="toolTypeName" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="120" v-if="!isDetail">
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
        <el-form-item label="工具类型" prop="toolTypeId">
          <TmToolTypeSelect
            v-model="formData.toolTypeId"
            placeholder="请选择工具类型"
            class="!w-1/1"
            :disabled="dialogFormType === 'update'"
          />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="1"
            controls-position="right"
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
import { MdWorkstationToolApi, MdWorkstationToolVO } from '@/api/mes/md/workstation/tool'
import TmToolTypeSelect from '@/views/mes/tm/tool/components/TmToolTypeSelect.vue'

defineOptions({ name: 'WorkstationToolList' })

const props = defineProps<{
  workstationId: number // 工作站编号
  formType: string // 业务表单的类型
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const isDetail = computed(() => props.formType === 'detail') // 是否详情模式（只读）

const loading = ref(false) // 列表的加载中
const list = ref<MdWorkstationToolVO[]>([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationToolApi.getWorkstationToolList(props.workstationId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const dialogFormType = ref('') // 表单的类型：create - 新增；update - 修改
const formLoading = ref(false) // 表单的加载中
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  workstationId: undefined as number | undefined,
  toolTypeId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
})
const formRules = reactive({
  toolTypeId: [{ required: true, message: '工具类型不能为空', trigger: 'blur' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

/** 打开表单弹窗 */
const openForm = (type: string, row?: MdWorkstationToolVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  dialogFormType.value = type
  resetForm()
  // 修改时，设置数据
  if (type === 'update' && row) {
    formData.value = { ...row }
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
    const data = formData.value as unknown as MdWorkstationToolVO
    if (dialogFormType.value === 'create') {
      await MdWorkstationToolApi.createWorkstationTool(data)
      message.success(t('common.createSuccess'))
    } else {
      await MdWorkstationToolApi.updateWorkstationTool(data)
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
    workstationId: props.workstationId,
    toolTypeId: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MdWorkstationToolApi.deleteWorkstationTool(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 workstationId 变化，加载列表 */
watch(
  () => props.workstationId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)
</script>
