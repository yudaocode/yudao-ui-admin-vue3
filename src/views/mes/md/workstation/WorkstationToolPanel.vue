<template>
  <div>
    <el-button type="primary" plain size="small" @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加工具
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="工具类型编号" align="center" prop="toolTypeId" />
      <el-table-column label="工具类型名称" align="center" prop="toolTypeName" />
      <el-table-column label="数量" align="center" prop="quantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑弹窗 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        v-loading="formLoading"
      >
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
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
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

const { t } = useI18n() // 国际化
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
const formLoading = ref(false) // 表单的提交加载中
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

/** 打开表单弹窗 */
const openForm = (type: string, row?: MdWorkstationToolVO) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，何止数据
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
    if (formType.value === 'create') {
      await MdWorkstationToolApi.createWorkstationTool(data)
      message.success(t('common.updateSuccess'))
    } else {
      await MdWorkstationToolApi.updateWorkstationTool(data)
      message.success(t('common.createSuccess'))
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
