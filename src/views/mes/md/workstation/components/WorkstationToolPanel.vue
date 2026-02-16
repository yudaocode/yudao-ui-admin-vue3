<template>
  <div>
    <el-button type="primary" plain size="small" @click="openAddForm" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加工具
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="工具类型编号" align="center" prop="toolTypeId" />
      <el-table-column label="工具类型名称" align="center" prop="toolTypeName" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openEditForm(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑弹窗 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="工具类型" prop="toolTypeId">
          <!-- TODO @芋艿：对接工具类型下拉列表，等 TM 工具模块完成后对接 -->
          <el-input-number
            v-model="formData.toolTypeId"
            placeholder="请输入工具类型编号"
            class="!w-1/1"
            :disabled="formType === 'update'"
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
        <el-button @click="submitForm" type="primary">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MdWorkstationToolApi, MdWorkstationToolVO } from '@/api/mes/md/workstation/tool'

const props = defineProps<{
  workstationId: number // 工作站编号
}>()

const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表加载中
const list = ref<MdWorkstationToolVO[]>([]) // 工装夹具资源列表

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationToolApi.getWorkstationToolList(props.workstationId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加/编辑工具 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  workstationId: undefined as number | undefined,
  toolTypeId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
}) // 表单数据
const formRules = reactive({
  toolTypeId: [{ required: true, message: '工具类型不能为空', trigger: 'blur' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
}) // 表单校验规则

/** 打开添加弹窗 */
// TODO @AI：是不是 openForm、resetForm 更好？因为编辑和添加其实是同一个表单，区别只是 formType 不同；这样和别的模块，更统一；
const openAddForm = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加工具'
  formType.value = 'create'
  formData.value = {
    id: undefined,
    workstationId: props.workstationId,
    toolTypeId: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 打开编辑弹窗 */
const openEditForm = (row: MdWorkstationToolVO) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑工具'
  formType.value = 'update'
  formData.value = { ...row }
}

/** 提交表单 */
const submitForm = async () => {
  // TODO @AI：和别的模块保持一致；类似 loading 啥的
  await formRef.value.validate()
  if (formType.value === 'update') {
    await MdWorkstationToolApi.updateWorkstationTool(
      formData.value as unknown as MdWorkstationToolVO
    )
    message.success('编辑成功')
  } else {
    await MdWorkstationToolApi.createWorkstationTool(
      formData.value as unknown as MdWorkstationToolVO
    )
    message.success('添加成功')
  }
  dialogVisible.value = false
  await getList()
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MdWorkstationToolApi.deleteWorkstationTool(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

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
