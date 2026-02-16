<template>
  <div>
    <el-button type="primary" plain size="small" @click="openAddForm" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加设备
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="设备编号" align="center" prop="machineryId" />
      <el-table-column label="设备名称" align="center" prop="machineryName" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="80">
        <template #default="scope">
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加设备弹窗 -->
    <Dialog title="添加设备" v-model="addDialogVisible" width="500px">
      <el-form ref="addFormRef" :model="addFormData" :rules="addFormRules" label-width="80px">
        <el-form-item label="设备" prop="machineryId">
          <!-- TODO @芋艿：对接设备下拉列表，等 DV 设备模块完成后对接 -->
          <el-input-number v-model="addFormData.machineryId" placeholder="请输入设备编号" class="!w-1/1" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="addFormData.quantity" :min="1" controls-position="right" class="!w-1/1" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="addFormData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitAddForm" type="primary">确 定</el-button>
        <el-button @click="addDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { MdWorkstationMachineApi, MdWorkstationMachineVO } from '@/api/mes/md/workstation/machine'

// TODO @AI：字段注释；
// TODO @AI：方法注释；

const props = defineProps<{
  workstationId: number
}>()

const message = useMessage()
const loading = ref(false)
const list = ref<MdWorkstationMachineVO[]>([])

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationMachineApi.getWorkstationMachineList(props.workstationId)
  } finally {
    loading.value = false
  }
}

/** 添加弹窗 */
// TODO @AI：使用 form，不要 add 前缀；
const addDialogVisible = ref(false)
const addFormRef = ref()
const addFormData = ref({
  workstationId: undefined as number | undefined,
  machineryId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
})
const addFormRules = reactive({
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

const openAddForm = () => {
  addDialogVisible.value = true
  addFormData.value = {
    workstationId: props.workstationId,
    machineryId: undefined,
    quantity: 1,
    remark: undefined
  }
  addFormRef.value?.resetFields()
}

const submitAddForm = async () => {
  await addFormRef.value.validate()
  await MdWorkstationMachineApi.createWorkstationMachine(addFormData.value as unknown as MdWorkstationMachineVO)
  message.success('添加成功')
  addDialogVisible.value = false
  await getList()
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MdWorkstationMachineApi.deleteWorkstationMachine(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 监听 workstationId 变化 */
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
