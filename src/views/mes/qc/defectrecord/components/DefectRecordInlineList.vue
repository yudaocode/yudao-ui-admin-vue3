<!-- 缺陷记录内联编辑列表（通用组件，供 IQC/IPQC/OQC/RQC 各模块复用） -->
<template>
  <Dialog title="缺陷记录" v-model="dialogVisible" width="900px">
    <!-- 新增按钮 -->
    <el-row class="mb-10px">
      <el-button type="primary" plain @click="handleAdd" v-hasPermi="['mes:qc-defect:create']">
        <Icon icon="ep:plus" class="mr-5px" /> 新增缺陷
      </el-button>
    </el-row>

    <!-- 内联编辑表格 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="缺陷描述" align="center" min-width="200">
        <template #default="scope">
          <el-input
            v-if="scope.row.editing"
            v-model="scope.row.name"
            placeholder="请输入缺陷描述"
          />
          <span v-else>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="缺陷等级" align="center" width="140">
        <template #default="scope">
          <el-select v-if="scope.row.editing" v-model="scope.row.level" placeholder="请选择">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_DEFECT_LEVEL)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
          <dict-tag v-else :type="DICT_TYPE.MES_DEFECT_LEVEL" :value="scope.row.level" />
        </template>
      </el-table-column>
      <el-table-column label="缺陷数量" align="center" width="120">
        <template #default="scope">
          <el-input-number
            v-if="scope.row.editing"
            v-model="scope.row.quantity"
            :min="1"
            controls-position="right"
            class="!w-1/1"
          />
          <span v-else>{{ scope.row.quantity }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" min-width="150">
        <template #default="scope">
          <el-input v-if="scope.row.editing" v-model="scope.row.remark" placeholder="请输入备注" />
          <span v-else>{{ scope.row.remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <template v-if="scope.row.editing">
            <el-button link type="success" @click="handleSave(scope.row)">保存</el-button>
            <el-button link type="info" @click="handleCancel(scope.row, scope.$index)">
              取消
            </el-button>
          </template>
          <template v-else>
            <el-button
              link
              type="primary"
              @click="handleEdit(scope.row)"
              v-hasPermi="['mes:qc-defect:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:qc-defect:update']"
            >
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { QcDefectRecordApi, QcDefectRecordVO } from '@/api/mes/qc/defectrecord'

/** 缺陷记录内联编辑弹窗（通用组件，供 IQC/IPQC/OQC/RQC 各模块复用） */
defineOptions({ name: 'DefectRecordInlineList' })

const emit = defineEmits(['refresh']) // 通知父组件刷新行统计

const message = useMessage()
const { t } = useI18n()

const dialogVisible = ref(false)
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)

// 当前操作的参数（通过 open 方法传入）
const qcType = ref<number>(0) // 检验类型：MesQcTypeEnum
const qcId = ref<number>(0) // 检验单 ID
const lineId = ref<number>(0) // 检验行 ID

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  qcType: undefined as number | undefined,
  qcId: undefined as number | undefined,
  lineId: undefined as number | undefined
})

/** 打开弹窗 */
const open = async (type: number, id: number, line: number) => {
  qcType.value = type
  qcId.value = id
  lineId.value = line
  queryParams.pageNo = 1
  dialogVisible.value = true
  await getList()
}
defineExpose({ open })

/** 查询列表 */
const getList = async () => {
  if (!qcId.value || !lineId.value) {
    return
  }
  queryParams.qcType = qcType.value
  queryParams.qcId = qcId.value
  queryParams.lineId = lineId.value
  loading.value = true
  try {
    const data = await QcDefectRecordApi.getDefectRecordPage(queryParams)
    list.value = data.list.map((item: QcDefectRecordVO) => ({ ...item, editing: false }))
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 新增行 */
const handleAdd = () => {
  list.value.unshift({
    id: undefined,
    qcType: qcType.value,
    qcId: qcId.value,
    lineId: lineId.value,
    name: '',
    level: undefined,
    quantity: 1,
    remark: '',
    editing: true,
    isNew: true
  })
}

/** 编辑行 */
const handleEdit = (row: any) => {
  row._backup = { ...row }
  row.editing = true
}

/** 保存行 */
const handleSave = async (row: any) => {
  // 校验必填
  if (!row.name) {
    message.warning('缺陷描述不能为空')
    return
  }
  if (!row.level) {
    message.warning('缺陷等级不能为空')
    return
  }
  try {
    if (row.isNew) {
      await QcDefectRecordApi.createDefectRecord(row)
      message.success(t('common.createSuccess'))
    } else {
      await QcDefectRecordApi.updateDefectRecord(row)
      message.success(t('common.updateSuccess'))
    }
    await getList()
    emit('refresh')
  } catch {}
}

/** 取消编辑 */
const handleCancel = (row: any, index: number) => {
  if (row.isNew) {
    list.value.splice(index, 1)
  } else {
    Object.assign(row, row._backup)
    row.editing = false
  }
}

/** 删除行 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await QcDefectRecordApi.deleteDefectRecord(id)
    message.success(t('common.delSuccess'))
    await getList()
    emit('refresh')
  } catch {}
}
</script>
