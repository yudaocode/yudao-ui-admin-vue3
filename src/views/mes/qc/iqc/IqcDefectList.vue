<!-- MES 来料检验缺陷记录 子列表（CRUD） -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button
        type="primary"
        plain
        size="small"
        @click="openForm('create')"
        v-hasPermi="['mes:qc-iqc:create']"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增缺陷记录
      </el-button>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="缺陷描述" align="center" prop="defectName" min-width="200" />
      <el-table-column label="缺陷等级" align="center" prop="defectLevel" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DEFECT_LEVEL" :value="scope.row.defectLevel" />
        </template>
      </el-table-column>
      <el-table-column label="缺陷数量" align="center" prop="defectQuantity" width="100" />
      <el-table-column label="备注" align="center" prop="remark" min-width="150" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:qc-iqc:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:qc-iqc:update']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label="检验行" prop="lineId">
          <!-- TODO @AI：使用组件 -->
          <el-select v-model="formData.lineId" placeholder="请选择检验行" filterable class="!w-1/1">
            <el-option
              v-for="line in lineList"
              :key="line.id"
              :label="
                line.indicatorName + (line.indicatorCode ? ' (' + line.indicatorCode + ')' : '')
              "
              :value="line.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="缺陷描述" prop="defectName">
          <el-input v-model="formData.defectName" placeholder="请输入缺陷描述" />
        </el-form-item>
        <el-form-item label="缺陷等级" prop="defectLevel">
          <el-select v-model="formData.defectLevel" placeholder="请选择缺陷等级" class="!w-1/1">
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.MES_DEFECT_LEVEL)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="缺陷数量" prop="defectQuantity">
          <el-input-number
            v-model="formData.defectQuantity"
            :min="1"
            placeholder="请输入"
            class="!w-1/1"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="formData.remark" placeholder="请输入备注" />
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
import { dateFormatter } from '@/utils/formatTime'
import { getStrDictOptions, DICT_TYPE } from '@/utils/dict'
import { QcIqcDefectApi, QcIqcDefectVO } from '@/api/mes/qc/iqc/defect'
import { QcIqcLineApi, QcIqcLineVO } from '@/api/mes/qc/iqc/line'

defineOptions({ name: 'IqcDefectList' })

const props = defineProps<{ iqcId: number }>()

const message = useMessage()
const { t } = useI18n()

const loading = ref(false)
const list = ref<QcIqcDefectVO[]>([])
const lineList = ref<QcIqcLineVO[]>([]) // 检验行列表（用于缺陷记录选择）

/** 查询列表 */
const getList = async () => {
  if (!props.iqcId) return
  loading.value = true
  try {
    const data = await QcIqcDefectApi.getIqcDefectPage({
      pageNo: 1,
      pageSize: 100,
      iqcId: props.iqcId
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 加载检验行列表 */
const loadLineList = async () => {
  if (!props.iqcId) return
  const data = await QcIqcLineApi.getIqcLinePage({
    pageNo: 1,
    pageSize: 100,
    iqcId: props.iqcId
  })
  lineList.value = data.list
}

// ==================== 添加/修改 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()
const formData = ref({
  id: undefined,
  iqcId: undefined as number | undefined,
  lineId: undefined,
  defectName: undefined,
  defectLevel: undefined,
  defectQuantity: 1,
  remark: undefined
})
const formRules = reactive({
  lineId: [{ required: true, message: '检验行不能为空', trigger: 'change' }],
  defectName: [{ required: true, message: '缺陷描述不能为空', trigger: 'blur' }],
  defectLevel: [{ required: true, message: '缺陷等级不能为空', trigger: 'change' }]
})

/** 添加/修改操作 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.iqcId = props.iqcId
  // 加载检验行列表
  await loadLineList()
  // 修改时，查询详情（缺陷记录只有分页接口，从列表中获取）
  if (id) {
    formLoading.value = true
    try {
      const defect = list.value.find((d) => d.id === id)
      if (defect) {
        formData.value = { ...defect } as any
      }
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = formData.value as unknown as QcIqcDefectVO
    if (formType.value === 'create') {
      await QcIqcDefectApi.createIqcDefect(data)
      message.success(t('common.createSuccess'))
    } else {
      await QcIqcDefectApi.updateIqcDefect(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    iqcId: undefined,
    lineId: undefined,
    defectName: undefined,
    defectLevel: undefined,
    defectQuantity: 1,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await QcIqcDefectApi.deleteIqcDefect(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 监听 iqcId 变化，重新加载列表 */
watch(
  () => props.iqcId,
  () => getList(),
  { immediate: true }
)
</script>
