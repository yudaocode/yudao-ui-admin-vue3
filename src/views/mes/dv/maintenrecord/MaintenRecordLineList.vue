<!-- MES 设备保养记录明细列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px" v-if="!disabled">
      <el-button type="primary" plain @click="openForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加明细
      </el-button>
    </el-row>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="项目名称" align="center" prop="subjectName" />
      <el-table-column label="项目内容" align="center" prop="subjectContent" />
      <el-table-column label="标准" align="center" prop="subjectStandard" />
      <el-table-column label="保养结果" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MAINTEN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="异常描述" align="center" prop="result" />
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
    <Dialog :title="formTitle" v-model="formVisible" width="500px">
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
        <el-form-item label="保养结果" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_MAINTEN_STATUS)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="异常描述" prop="result">
          <el-input v-model="formData.result" type="textarea" placeholder="请输入异常描述" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { DvMaintenRecordLineApi } from '@/api/mes/dv/maintenrecord/line'
import { DvSubjectApi } from '@/api/mes/dv/subject'

defineOptions({ name: 'MaintenRecordLineList' })

const props = defineProps<{
  recordId: number
  disabled?: boolean
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  recordId: props.recordId
})

// 表单相关
const formVisible = ref(false) // 表单弹窗的是否展示
const formTitle = ref('') // 表单弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref<any>({}) // 表单数据
const formRules = reactive({
  subjectId: [{ required: true, message: '项目不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '保养结果不能为空', trigger: 'blur' }]
})
const subjectOptions = ref<any[]>([]) // 项目选项列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvMaintenRecordLineApi.getMaintenRecordLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const openForm = async (type: string, row?: any) => {
  formVisible.value = true
  formTitle.value = type === 'create' ? '添加明细' : '编辑明细'
  formType.value = type
  if (type === 'create') {
    formData.value = {
      recordId: props.recordId,
      subjectId: undefined,
      status: 1,
      result: '',
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
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await DvMaintenRecordLineApi.createMaintenRecordLine(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await DvMaintenRecordLineApi.updateMaintenRecordLine(formData.value)
      message.success(t('common.updateSuccess'))
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvMaintenRecordLineApi.deleteMaintenRecordLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 获取项目选项 */
const getSubjectOptions = async (query: string) => {
  try {
    const data = await DvSubjectApi.getSubjectPage({ name: query, pageNo: 1, pageSize: 20 })
    subjectOptions.value = data.list
  } catch {}
}

/** 监听记录编号变化 */
watch(
  () => props.recordId,
  (val) => {
    if (val) {
      queryParams.recordId = val
      getList()
    }
  },
  { immediate: true }
)
</script>
