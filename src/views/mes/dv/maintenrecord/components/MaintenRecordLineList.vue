<!-- TODO @AI：参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/pro/route -->
<template>
  <div class="app-container">
    <el-row :gutter="10" class="mb8" v-if="!disabled">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:dv-mainten-record:update']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column label="项目名称" align="center" prop="subjectName" />
      <el-table-column label="项目内容" align="center" prop="subjectContent" />
      <el-table-column label="标准" align="center" prop="subjectStandard" />
      <el-table-column label="保养结果" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MAINTEN_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="异常描述" align="center" prop="result" />
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        v-if="!disabled"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:dv-mainten-record:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:dv-mainten-record:update']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <MaintenRecordLineForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { DvMaintenRecordLineApi } from '@/api/mes/dv/maintenrecord/maintenRecordLine'
import MaintenRecordLineForm from './MaintenRecordLineForm.vue'
import { DICT_TYPE } from '@/utils/dict'

const props = defineProps({
  recordId: {
    type: Number,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const message = useMessage()

const loading = ref(true)
const list = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  recordId: props.recordId
})

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
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, props.recordId)
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

watch(
  () => props.recordId,
  () => {
    queryParams.recordId = props.recordId
    getList()
  },
  { immediate: true }
)
</script>
