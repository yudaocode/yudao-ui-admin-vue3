<!-- MES 流转卡工序记录列表子组件 -->
<template>
  <div>
    <!-- 操作按钮 -->
    <div class="mb-10px" v-if="!disabled">
      <el-button type="primary" plain @click="openProcessForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 新增
      </el-button>
    </div>

    <!-- 工序记录列表 -->
    <el-table v-loading="loading" :data="processList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="序号" align="center" prop="sort" width="60" />
      <el-table-column label="工序编码" align="center" prop="processCode" width="120" />
      <el-table-column label="工序名称" align="center" prop="processName" min-width="120" />
      <el-table-column label="进入工序时间" align="center" prop="inputTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="出工序时间" align="center" prop="outputTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="投入数量" align="center" prop="inputQuantity" width="100" />
      <el-table-column label="产出数量" align="center" prop="outputQuantity" width="100" />
      <el-table-column label="不合格数量" align="center" prop="unqualifiedQuantity" width="100" />
      <el-table-column label="工位编码" align="center" prop="workstationCode" width="120" />
      <el-table-column label="工位名称" align="center" prop="workstationName" min-width="120" />
      <el-table-column label="操作人" align="center" prop="nickname" width="100" />
      <el-table-column label="操作" align="center" width="160" v-if="!disabled">
        <template #default="scope">
          <el-button link type="primary" @click="openProcessForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="processTotal"
      v-model:page="processQueryParams.pageNo"
      v-model:limit="processQueryParams.pageSize"
      @pagination="getProcessList"
    />

    <!-- 工序记录编辑弹窗（内联） -->
    <Dialog :title="processDialogTitle" v-model="processDialogVisible" width="960px">
      <el-form
        ref="processFormRef"
        :model="processFormData"
        :rules="processFormRules"
        label-width="120px"
        v-loading="processFormLoading"
      >
        <el-row>
          <el-col :span="12">
            <el-form-item label="序号" prop="sort">
              <el-input-number v-model="processFormData.sort" :min="0" class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序" prop="processId">
              <ProProcessSelect v-model="processFormData.processId" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="进入工序时间" prop="inputTime">
              <el-date-picker
                v-model="processFormData.inputTime"
                type="datetime"
                placeholder="请选择时间"
                value-format="x"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出工序时间" prop="outputTime">
              <el-date-picker
                v-model="processFormData.outputTime"
                type="datetime"
                placeholder="请选择时间"
                value-format="x"
                class="!w-1/1"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <el-form-item label="投入数量" prop="inputQuantity">
              <el-input-number v-model="processFormData.inputQuantity" :min="0" :precision="2" class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产出数量" prop="outputQuantity">
              <el-input-number v-model="processFormData.outputQuantity" :min="0" :precision="2" class="!w-1/1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="不合格数量" prop="unqualifiedQuantity">
              <el-input-number v-model="processFormData.unqualifiedQuantity" :min="0" :precision="2" class="!w-1/1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="工位" prop="workstationId">
              <MdWorkstationSelect v-model="processFormData.workstationId" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input type="textarea" v-model="processFormData.remark" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="submitProcessForm" type="primary" :disabled="processFormLoading">确 定</el-button>
        <el-button @click="processDialogVisible = false">取 消</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { ProCardProcessApi, ProCardProcessVO } from '@/api/mes/pro/card/process'
import ProProcessSelect from '@/views/mes/pro/process/components/ProProcessSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'

defineOptions({ name: 'CardProcessList' })

const props = defineProps<{
  cardId: number
  disabled?: boolean
}>()

const message = useMessage()
const { t } = useI18n()

// ==================== 工序记录列表 ====================
const loading = ref(false)
const processList = ref<ProCardProcessVO[]>([])
const processTotal = ref(0)
const processQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  cardId: undefined as number | undefined
})

/** 查询工序记录列表 */
const getProcessList = async () => {
  loading.value = true
  try {
    processQueryParams.cardId = props.cardId
    const data = await ProCardProcessApi.getCardProcessPage(processQueryParams)
    processList.value = data.list
    processTotal.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除工序记录 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProCardProcessApi.deleteCardProcess(id)
    message.success(t('common.delSuccess'))
    await getProcessList()
  } catch {}
}

// ==================== 工序记录编辑表单（内联） ====================
const processDialogVisible = ref(false)
const processDialogTitle = ref('')
const processFormLoading = ref(false)
const processFormRef = ref()
const processFormData = ref({
  id: undefined as number | undefined,
  cardId: undefined as number | undefined,
  sort: undefined as number | undefined,
  processId: undefined as number | undefined,
  inputTime: undefined as any,
  outputTime: undefined as any,
  inputQuantity: undefined as number | undefined,
  outputQuantity: undefined as number | undefined,
  unqualifiedQuantity: undefined as number | undefined,
  workstationId: undefined as number | undefined,
  remark: undefined as string | undefined
})
const processFormRules = reactive({})

/** 打开工序记录表单 */
const openProcessForm = (type: string, row?: any) => {
  processDialogVisible.value = true
  processDialogTitle.value = type === 'create' ? '新增工序记录' : '编辑工序记录'
  if (type === 'create') {
    processFormData.value = {
      id: undefined,
      cardId: props.cardId,
      sort: undefined,
      processId: undefined,
      inputTime: undefined,
      outputTime: undefined,
      inputQuantity: undefined,
      outputQuantity: undefined,
      unqualifiedQuantity: undefined,
      workstationId: undefined,
      remark: undefined
    }
  } else {
    processFormData.value = {
      id: row.id,
      cardId: row.cardId,
      sort: row.sort,
      processId: row.processId,
      inputTime: row.inputTime,
      outputTime: row.outputTime,
      inputQuantity: row.inputQuantity,
      outputQuantity: row.outputQuantity,
      unqualifiedQuantity: row.unqualifiedQuantity,
      workstationId: row.workstationId,
      remark: row.remark
    }
  }
  processFormRef.value?.resetFields()
}

/** 提交表单 */
const submitProcessForm = async () => {
  await processFormRef.value.validate()
  processFormLoading.value = true
  try {
    const data = processFormData.value as unknown as ProCardProcessVO
    if (processFormData.value.id) {
      await ProCardProcessApi.updateCardProcess(data)
      message.success(t('common.updateSuccess'))
    } else {
      await ProCardProcessApi.createCardProcess(data)
      message.success(t('common.createSuccess'))
    }
    processDialogVisible.value = false
    await getProcessList()
  } finally {
    processFormLoading.value = false
  }
}

// ==================== 初始化 ====================
onMounted(async () => {
  await getProcessList()
})
</script>
