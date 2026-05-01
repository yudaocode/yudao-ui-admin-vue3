<!-- MES 维修工单行列表 -->
<template>
  <div class="overflow-hidden">
    <!-- 操作栏 -->
    <el-button v-if="!disabled" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加明细
    </el-button>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="项目名称" align="center" prop="subjectName" />
      <el-table-column label="故障描述" align="center" prop="malfunction" />
      <el-table-column label="故障图片" align="center" prop="malfunctionUrl" />
      <el-table-column label="维修描述" align="center" prop="description" />
      <el-table-column label="项目内容" align="center" prop="subjectContent" />
      <el-table-column label="标准" align="center" prop="subjectStandard" />
      <el-table-column label="操作" align="center" width="130" v-if="!disabled">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="项目" prop="subjectId">
          <el-select
            v-model="formData.subjectId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入项目名称搜索"
            :remote-method="getSubjectOptions"
          >
            <el-option
              v-for="item in subjectOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述" prop="malfunction">
          <el-input v-model="formData.malfunction" type="textarea" placeholder="请输入故障描述" />
        </el-form-item>
        <el-form-item label="故障图片" prop="malfunctionUrl">
          <el-input v-model="formData.malfunctionUrl" placeholder="请输入故障图片 URL" />
        </el-form-item>
        <el-form-item label="维修描述" prop="description">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入维修描述" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitForm" type="primary" :loading="formLoading">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { DvRepairLineApi } from '@/api/mes/dv/repair/line'
import { DvSubjectApi } from '@/api/mes/dv/subject'

defineOptions({ name: 'RepairLineList' })

const props = defineProps<{
  repairId: number
  disabled?: boolean
}>()

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// ==================== 列表 ====================
const loading = ref(false) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  repairId: props.repairId
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvRepairLineApi.getRepairLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvRepairLineApi.deleteRepairLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const lineFormType = ref('') // 行表单的类型：create / update
const subjectOptions = ref<any[]>([]) // 项目选项列表
const formData = ref<any>({}) // 表单数据
const formRules = reactive({
  malfunction: [{ required: true, message: '故障描述不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 获取项目选项 */
const getSubjectOptions = async (query: string) => {
  try {
    const data = await DvSubjectApi.getSubjectPage({ name: query, pageNo: 1, pageSize: 20 })
    subjectOptions.value = data.list
  } catch {}
}

/** 打开表单弹窗 */
const openForm = async (type: string, row?: any) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加明细' : '编辑明细'
  lineFormType.value = type
  if (type === 'create') {
    formData.value = {
      repairId: props.repairId,
      subjectId: undefined,
      malfunction: '',
      malfunctionUrl: '',
      description: '',
      remark: ''
    }
  } else {
    formData.value = { ...row }
    if (row.subjectId) {
      const subject = await DvSubjectApi.getSubject(row.subjectId)
      if (subject) subjectOptions.value = [subject]
    }
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (lineFormType.value === 'create') {
      await DvRepairLineApi.createRepairLine(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await DvRepairLineApi.updateRepairLine(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 监听工单编号变化 */
watch(
  () => props.repairId,
  (val) => {
    if (val) {
      queryParams.repairId = val
      getList()
    }
  },
  { immediate: true }
)
</script>
