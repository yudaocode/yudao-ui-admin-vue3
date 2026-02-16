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
            :disabled="isEdit"
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

// TODO @AI：字段注释；
// TODO @AI：方法注释；

const props = defineProps<{
  workstationId: number
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<MdWorkstationToolVO[]>([])

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationToolApi.getWorkstationToolList(props.workstationId)
  } finally {
    loading.value = false
  }
}

/** 弹窗 */
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false) // TODO @AI：参考别的模块，formType？
const formRef = ref()
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

const openAddForm = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加工具'
  isEdit.value = false
  formData.value = {
    id: undefined,
    workstationId: props.workstationId,
    toolTypeId: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

const openEditForm = (row: MdWorkstationToolVO) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑工具'
  isEdit.value = true
  formData.value = { ...row }
}

const submitForm = async () => {
  await formRef.value.validate()
  if (isEdit.value) {
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
