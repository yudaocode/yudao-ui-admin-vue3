<template>
  <doc-alert title="【PMS】项目详情与迭代" url="https://doc.iocoder.cn/pms/pm/project/detail/" />

  <!-- 迭代搜索与操作 -->
  <div class="mb-16px flex flex-wrap items-center justify-between gap-12px">
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="搜索迭代"
          @clear="handleQuery"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-popover
          :visible="showFilterPopover"
          :show-arrow="false"
          :width="360"
          persistent
          placement="bottom-start"
        >
          <template #reference>
            <el-button @click="showFilterPopover = !showFilterPopover">
              <Icon class="mr-5px" icon="ep:plus" />高级筛选
            </el-button>
          </template>
          <el-form-item class="font-bold" label="迭代状态" label-position="top" prop="status">
            <el-select
              v-model="queryParams.status"
              class="!w-full"
              clearable
              placeholder="全部状态"
            >
              <el-option label="未开始" :value="PmsIterationStatus.PLANNED" />
              <el-option label="进行中" :value="PmsIterationStatus.ACTIVE" />
              <el-option label="已完成" :value="PmsIterationStatus.COMPLETED" />
            </el-select>
          </el-form-item>
          <div class="flex justify-end">
            <el-button @click="resetQuery">清空</el-button>
            <el-button @click="showFilterPopover = false">取消</el-button>
            <el-button type="primary" @click="handleAdvancedQuery">确认</el-button>
          </div>
        </el-popover>
      </el-form-item>
    </el-form>
    <el-button
      v-if="editable"
      v-hasPermi="['pms:pm:iteration:create']"
      type="primary"
      @click="openForm('create')"
    >
      新建迭代
    </el-button>
  </div>

  <!-- 列表 -->
  <el-table
    v-loading="loading"
    :data="iterationList"
    :show-overflow-tooltip="true"
    class="[&_.el-table__row]:cursor-pointer"
    @row-click="handleRowClick"
  >
    <el-table-column label="引用 ID" width="90">
      <template #default="scope">#{{ scope.row.id }}</template>
    </el-table-column>
    <el-table-column label="迭代名称" min-width="200">
      <template #default="scope">
        <el-button link type="primary" @click.stop="openDetail(scope.row)">
          {{ scope.row.name }}
        </el-button>
      </template>
    </el-table-column>
    <el-table-column :formatter="dateFormatter" label="开始时间" prop="startTime" width="180" />
    <el-table-column :formatter="dateFormatter" label="结束时间" prop="endTime" width="180" />
    <el-table-column align="center" label="状态" width="100">
      <template #default="scope">
        <el-tag :type="getIterationStatusTagType(scope.row.status)">
          {{ getIterationStatusName(scope.row.status) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column align="center" label="进度" width="160">
      <template #default="scope">
        <el-progress :percentage="scope.row.progress" />
      </template>
    </el-table-column>
    <el-table-column label="负责人" min-width="110" prop="ownerUserName" />
    <el-table-column v-if="editable" align="center" fixed="right" label="操作" width="90">
      <template #default="scope">
        <el-dropdown trigger="click" @command="handleIterationCommand($event, scope.row)">
          <el-button link type="primary" @click.stop>更多</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="
                  scope.row.status === PmsIterationStatus.PLANNED &&
                  checkPermi(['pms:pm:iteration:update'])
                "
                command="start"
              >
                开始迭代
              </el-dropdown-item>
              <el-dropdown-item
                v-if="
                  scope.row.status === PmsIterationStatus.ACTIVE &&
                  checkPermi(['pms:pm:iteration:update'])
                "
                command="complete"
              >
                完成迭代
              </el-dropdown-item>
              <el-dropdown-item v-if="checkPermi(['pms:pm:iteration:update'])" command="edit">
                编辑迭代
              </el-dropdown-item>
              <el-dropdown-item
                v-if="checkPermi(['pms:pm:iteration:delete'])"
                command="delete"
                divided
              >
                删除迭代
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-table-column>
  </el-table>
  <!-- 分页 -->
  <Pagination
    v-model:limit="queryParams.pageSize"
    v-model:page="queryParams.pageNo"
    :total="total"
    @pagination="getIterationList"
  />

  <!-- 表单弹窗：添加/修改、开始迭代 -->
  <IterationForm ref="formRef" @success="getIterationList" />
  <IterationStartForm ref="startFormRef" @success="getIterationList" />
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as IterationApi from '@/api/pms/pm/iteration'
import { PmsIterationStatus } from '@/views/pms/pm/utils/constants'
import IterationForm from '../components/IterationForm.vue'
import IterationStartForm from '../components/IterationStartForm.vue'
import { getIterationStatusName, getIterationStatusTagType } from '@/views/pms/pm/utils/format'
import { checkPermi } from '@/utils/permission'

defineOptions({ name: 'PmsIterationList' })

const props = defineProps<{
  projectId: number
  editable: boolean
}>()

const message = useMessage() // 消息弹窗
const { push } = useRouter() // 路由操作
const loading = ref(true) // 列表加载中
const total = ref(0) // 列表总数
const iterationList = ref<IterationApi.PmsIterationVO[]>([]) // 迭代列表
const showFilterPopover = ref(false) // 是否显示高级筛选
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  projectId: props.projectId,
  name: '',
  status: undefined as number | undefined
}) // 查询参数
const queryFormRef = ref() // 查询表单 Ref
const formRef = ref<InstanceType<typeof IterationForm>>() // 迭代表单 Ref
const startFormRef = ref<InstanceType<typeof IterationStartForm>>() // 开始迭代表单 Ref

/** 查询迭代分页 */
async function getIterationList() {
  loading.value = true
  try {
    const data = await IterationApi.getIterationPage(queryParams)
    iterationList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getIterationList()
}

/** 高级筛选确认 */
function handleAdvancedQuery() {
  showFilterPopover.value = false
  handleQuery()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  showFilterPopover.value = false
  handleQuery()
}

/** 打开迭代详情 */
function openDetail(iteration: IterationApi.PmsIterationVO) {
  push({
    name: 'PmsIterationDetail',
    params: {
      id: iteration.id
    }
  })
}

/** 点击迭代行查看详情 */
function handleRowClick(iteration: IterationApi.PmsIterationVO) {
  openDetail(iteration)
}

/** 处理迭代操作 */
function handleIterationCommand(command: string, iteration: IterationApi.PmsIterationVO) {
  if (command === 'start') {
    openStartForm(iteration)
  } else if (command === 'complete') {
    handleComplete(iteration)
  } else if (command === 'edit') {
    openForm('update', iteration.id)
  } else if (command === 'delete') {
    handleDelete(iteration)
  }
}

/** 打开迭代表单 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, props.projectId, id)
}

/** 打开开始迭代表单 */
function openStartForm(iteration: IterationApi.PmsIterationVO) {
  startFormRef.value?.open(iteration)
}

/** 完成迭代 */
async function handleComplete(iteration: IterationApi.PmsIterationVO) {
  try {
    // 完成的二次确认
    await message.confirm(`确认完成迭代“${iteration.name}”吗？`)
    // 发起完成
    await IterationApi.completeIteration(iteration.id!)
    message.success('迭代已完成')
    await getIterationList()
  } catch {}
}

/** 删除迭代 */
async function handleDelete(iteration: IterationApi.PmsIterationVO) {
  try {
    // 删除的二次确认
    await message.delConfirm(`确认删除迭代“${iteration.name}”吗？`)
    // 发起删除
    await IterationApi.deleteIteration(iteration.id!)
    message.success('删除成功')
    await getIterationList()
  } catch {}
}

defineExpose({ refresh: getIterationList })

/** 初始化 */
onMounted(() => {
  getIterationList()
})
</script>
