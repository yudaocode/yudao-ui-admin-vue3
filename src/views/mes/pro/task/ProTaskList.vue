<!-- MES 生产任务列表（工单维度，排产 Drawer 内使用） -->
<!-- TODO @芋艿：待 review -->
<template>
  <div>
    <!-- 操作栏 -->
    <div class="mb-10px">
      <el-button
        type="primary"
        plain
        @click="handleAdd"
        v-hasPermi="['mes:pro-task:create']"
        :disabled="disabled"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增任务
      </el-button>
    </div>

    <!-- 任务列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="任务编码" align="center" prop="code" width="140" />
      <el-table-column label="任务名称" align="center" prop="name" min-width="150" />
      <el-table-column label="工作站" align="center" prop="workstationName" width="120" />
      <el-table-column label="排产数量" align="center" prop="quantity" width="100" />
      <el-table-column label="已生产" align="center" prop="producedQuantity" width="80" />
      <el-table-column label="合格" align="center" prop="qualifyQuantity" width="80" />
      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="时长(天)" align="center" prop="duration" width="80" />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="颜色" align="center" prop="colorCode" width="60">
        <template #default="scope">
          <div
            :style="{
              background: scope.row.colorCode || '#00AEF3',
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              margin: '0 auto'
            }"
          ></div>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <!-- 草稿(0)：编辑/删除/开始 -->
          <template v-if="scope.row.status === MesProTaskStatusEnum.NORMAL">
            <el-button
              link
              type="primary"
              @click="handleEdit(scope.row)"
              v-hasPermi="['mes:pro-task:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:pro-task:delete']"
            >
              删除
            </el-button>
          </template>
          <!-- 进行中(1)：暂停/完成/取消 -->
          <template v-if="scope.row.status === MesProTaskStatusEnum.START">
            <el-button
              link
              type="warning"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.PAUSE, '暂停')"
              v-hasPermi="['mes:pro-task:update']"
            >
              暂停
            </el-button>
            <el-button
              link
              type="success"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.FINISHED, '完成')"
              v-hasPermi="['mes:pro-task:update']"
            >
              完成
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.CANCELED, '取消')"
              v-hasPermi="['mes:pro-task:update']"
            >
              取消
            </el-button>
          </template>
          <!-- 暂停(2)：继续/完成/取消 -->
          <template v-if="scope.row.status === MesProTaskStatusEnum.PAUSE">
            <el-button
              link
              type="primary"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.START, '继续')"
              v-hasPermi="['mes:pro-task:update']"
            >
              继续
            </el-button>
            <el-button
              link
              type="success"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.FINISHED, '完成')"
              v-hasPermi="['mes:pro-task:update']"
            >
              完成
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleChangeStatus(scope.row.id, MesProTaskStatusEnum.CANCELED, '取消')"
              v-hasPermi="['mes:pro-task:update']"
            >
              取消
            </el-button>
          </template>
          <!-- 所有状态：详情 -->
          <el-button
            link
            type="primary"
            @click="handleDetail(scope.row)"
            v-hasPermi="['mes:pro-task:query']"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 任务表单 -->
    <ProTaskForm ref="formRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'
import { ProRouteProcessVO } from '@/api/mes/pro/route/process'
import { MesProTaskStatusEnum } from '@/views/mes/utils/constants'
import ProTaskForm from './ProTaskForm.vue'

defineOptions({ name: 'ProTaskList' })

const props = defineProps<{
  workOrderId: number
  workOrderCode?: string
  workOrderName?: string
  routeId: number
  processId: number
  itemId?: number
  unitMeasureId?: number
  processList?: ProRouteProcessVO[]
  disabled?: boolean
}>()

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const list = ref<ProTaskVO[]>([])

/** 查询任务列表（按工单+工序过滤） */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProTaskApi.getTaskPage({
      workOrderId: props.workOrderId,
      processId: props.processId,
      pageNo: 1,
      pageSize: 100
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 新增任务 */
const formRef = ref()
const handleAdd = () => {
  formRef.value.open('create', {
    workOrderId: props.workOrderId,
    workOrderCode: props.workOrderCode,
    workOrderName: props.workOrderName,
    routeId: props.routeId,
    processId: props.processId,
    itemId: props.itemId,
    unitMeasureId: props.unitMeasureId,
    processList: props.processList
  })
}

/** 编辑任务 */
const handleEdit = (row: any) => {
  formRef.value.open('update', {
    id: row.id,
    workOrderId: props.workOrderId,
    workOrderCode: props.workOrderCode,
    workOrderName: props.workOrderName,
    processList: props.processList
  })
}

/** 查看详情 */
const handleDetail = (row: any) => {
  formRef.value.open('detail', {
    id: row.id,
    processList: props.processList
  })
}

/** 删除任务 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProTaskApi.deleteTask(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 变更任务状态 */
const handleChangeStatus = async (id: number, status: number, actionName: string) => {
  try {
    await message.confirm(`确认要${actionName}该任务吗？`)
    await ProTaskApi.updateTask({ id, status } as any)
    message.success(`任务已${actionName}`)
    await getList()
  } catch {}
}

// 监听 processId 切换重新加载
watch(
  () => props.processId,
  () => getList()
)

onMounted(() => getList())

defineExpose({ getList })
</script>
