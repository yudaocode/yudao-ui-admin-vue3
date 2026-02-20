<!-- MES 设备点检记录明细列表 -->
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
      <el-table-column label="项目编码" align="center" prop="subjectCode" />
      <el-table-column label="项目名称" align="center" prop="subjectName" />
      <el-table-column label="检查内容" align="center" prop="subjectContent" />
      <el-table-column label="检查标准" align="center" prop="subjectStandard" />
      <el-table-column label="点检结果" align="center" prop="checkStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_CHECK_RESULT" :value="scope.row.checkStatus" />
        </template>
      </el-table-column>
      <el-table-column label="异常描述" align="center" prop="checkResult" />
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
        <el-form-item label="点检项目" prop="subjectId">
          <DvSubjectSelect v-model="formData.subjectId" />
        </el-form-item>
        <el-form-item label="点检结果" prop="checkStatus">
          <el-radio-group v-model="formData.checkStatus">
            <el-radio
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_CHECK_RESULT)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="异常描述" prop="checkResult" v-if="formData.checkStatus === MesDvCheckResultEnum.ABNORMAL">
          <el-input v-model="formData.checkResult" type="textarea" placeholder="请输入异常描述" />
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
import { DvCheckRecordLineApi } from '@/api/mes/dv/checkrecord/line'
import DvSubjectSelect from '@/views/mes/dv/subject/components/DvSubjectSelect.vue'
import { MesDvCheckResultEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'CheckRecordLineList' })

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
  subjectId: [{ required: true, message: '点检项目不能为空', trigger: 'blur' }],
  checkStatus: [{ required: true, message: '点检结果不能为空', trigger: 'blur' }]
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvCheckRecordLineApi.getCheckRecordLinePage(queryParams)
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
      checkStatus: MesDvCheckResultEnum.NORMAL,
      checkResult: '',
      remark: ''
    }
  } else {
    formData.value = { ...row }
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
      await DvCheckRecordLineApi.createCheckRecordLine(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await DvCheckRecordLineApi.updateCheckRecordLine(formData.value)
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
    await DvCheckRecordLineApi.deleteCheckRecordLine(id)
    message.success(t('common.delSuccess'))
    await getList()
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
