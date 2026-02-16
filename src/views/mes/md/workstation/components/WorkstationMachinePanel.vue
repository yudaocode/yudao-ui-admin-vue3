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
    <Dialog title="添加设备" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="设备" prop="machineryId">
          <!-- TODO @芋艿：对接设备下拉列表，等 DV 设备模块完成后对接 -->
          <el-input-number
            v-model="formData.machineryId"
            placeholder="请输入设备编号"
            class="!w-1/1"
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
import { MdWorkstationMachineApi, MdWorkstationMachineVO } from '@/api/mes/md/workstation/machine'

const props = defineProps<{
  workstationId: number // 工作站编号
}>()

const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表加载中
const list = ref<MdWorkstationMachineVO[]>([]) // 设备资源列表

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await MdWorkstationMachineApi.getWorkstationMachineList(props.workstationId)
  } finally {
    loading.value = false
  }
}

// ==================== 添加设备 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const formRef = ref() // 表单 Ref
const formData = ref({
  workstationId: undefined as number | undefined,
  machineryId: undefined as number | undefined,
  quantity: 1,
  remark: undefined as string | undefined
}) // 表单数据
const formRules = reactive({
  machineryId: [{ required: true, message: '设备不能为空', trigger: 'blur' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
}) // 表单校验规则

/** 打开添加弹窗 */
const openAddForm = () => {
  dialogVisible.value = true
  formData.value = {
    workstationId: props.workstationId,
    machineryId: undefined,
    quantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  await MdWorkstationMachineApi.createWorkstationMachine(
    formData.value as unknown as MdWorkstationMachineVO
  )
  message.success('添加成功')
  dialogVisible.value = false
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
