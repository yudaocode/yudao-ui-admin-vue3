<template>
  <doc-alert
    title="【行政】会议室、车辆管理"
    url="https://doc.iocoder.cn/oa/administration/meeting-vehicle/"
  />
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="单据编号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入单据编号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option label="未提交" :value="BpmProcessInstanceStatus.NOT_START" />
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS).filter(
              (item) => item.value !== BpmProcessInstanceStatus.NOT_START
            )"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="车辆" prop="vehicleNo">
        <el-input
          v-model="queryParams.vehicleNo"
          placeholder="请输入车牌号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="申请部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="还车状态" prop="returnStatus">
        <el-select
          v-model="queryParams.returnStatus"
          placeholder="请选择还车状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="status in OA_VEHICLE_RETURN_STATUS"
            :key="status"
            :label="getDictLabel(DICT_TYPE.OA_VEHICLE_RETURN_STATUS, status)"
            :value="status"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:vehicle-apply:create']"
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="单据编号" min-width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.status === BpmProcessInstanceStatus.NOT_START" type="info">
            未提交
          </el-tag>
          <DictTag v-else :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="车辆" prop="vehicleNo" width="130" />
      <el-table-column label="用车事由" prop="reason" min-width="180" show-overflow-tooltip />
      <el-table-column label="出车时间" prop="startTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="回车时间" prop="endTime" :formatter="dateFormatter" width="180" />
      <el-table-column
        label="出车地点"
        prop="startLocation"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column label="回车地点" prop="endLocation" min-width="160" show-overflow-tooltip />
      <el-table-column label="随行人" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.passenger }}</template>
      </el-table-column>
      <el-table-column label="还车状态" width="110">
        <template #default="{ row }">
          <el-tag
            :type="row.returnStatus === OA_VEHICLE_RETURN_STATUS.RETURNED ? 'success' : 'info'"
          >
            {{ getDictLabel(DICT_TYPE.OA_VEHICLE_RETURN_STATUS, row.returnStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请人" prop="userName" width="120" />
      <el-table-column label="申请部门" prop="deptName" width="160" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.processInstanceId"
            v-hasPermi="['oa:vehicle-apply:query']"
            link
            type="primary"
            @click="handleProcessDetail(row)"
          >
            进度
          </el-button>
          <el-button
            v-if="
              row.status === BpmProcessInstanceStatus.APPROVE &&
              row.returnStatus === OA_VEHICLE_RETURN_STATUS.PENDING_RETURN
            "
            v-hasPermi="['oa:vehicle-return:create']"
            link
            type="primary"
            @click="openReturnForm(row.id)"
          >
            还车
          </el-button>
          <template v-if="row.status === BpmProcessInstanceStatus.NOT_START">
            <el-button
              v-hasPermi="['oa:vehicle-apply:update']"
              link
              type="primary"
              @click="formRef.open('update', row.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['oa:vehicle-apply:create']"
              link
              type="primary"
              @click="handleSubmit(row.id)"
            >
              提交
            </el-button>
            <el-button
              v-hasPermi="['oa:vehicle-apply:delete']"
              link
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
          <el-button
            v-if="row.status === BpmProcessInstanceStatus.RUNNING"
            v-hasPermi="['oa:vehicle-apply:update']"
            link
            type="danger"
            @click="handleCancel(row.id)"
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单及详情弹窗 -->
  <OaVehicleApplyForm ref="formRef" @success="getList" />
  <OaVehicleApplyDetail ref="detailRef" />
  <OaVehicleReturnForm ref="returnFormRef" @success="handleReturnSuccess" />
</template>

<script setup lang="ts">
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import * as VehicleApplyApi from '@/api/oa/vehicle/apply'
import { DICT_TYPE, getIntDictOptions, getDictLabel } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { BpmProcessInstanceStatus } from '@/utils/constants'
import OaVehicleApplyForm from './OaVehicleApplyForm.vue'
import OaVehicleApplyDetail from './OaVehicleApplyDetail.vue'
import OaVehicleReturnForm from '../return/OaVehicleReturnForm.vue'
import { OA_VEHICLE_RETURN_STATUS } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaVehicleApply' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 列表加载中
const list = ref<VehicleApplyApi.VehicleApplyVO[]>([]) // 列表数据
const total = ref(0) // 总条数
const queryParams = reactive({
  // 搜索参数
  pageNo: 1,
  pageSize: 10,
  no: undefined,
  vehicleNo: undefined,
  status: undefined,
  deptId: undefined,
  createTime: [],
  returnStatus: undefined
})
const queryFormRef = ref() // 搜索表单引用
const formRef = ref() // 表单引用
const detailRef = ref() // 详情引用
const returnFormRef = ref() // 还车表单引用
const router = useRouter() // 路由

/** 保存还车草稿后进入还车列表继续提交 */
function handleReturnSuccess() {
  router.push('/oa/vehicle/return')
}

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await VehicleApplyApi.getVehicleApplyPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 新增和修改按钮操作 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 审批进度 */
function handleProcessDetail(row: VehicleApplyApi.VehicleApplyVO) {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: row.processInstanceId }
  })
}

/** 查看详情 */
function openDetail(id: number) {
  detailRef.value.open(id)
}

/** 还车按钮操作 */
function openReturnForm(applyId: number) {
  returnFormRef.value.open('create', undefined, applyId)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 删除草稿
    await VehicleApplyApi.deleteVehicleApply(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 提交按钮操作 */
async function handleSubmit(id: number) {
  try {
    // 操作的二次确认
    await message.confirm('确认提交用车申请？')
    // 提交申请并发起审批
    await VehicleApplyApi.submitVehicleApply(id)
    message.success('提交成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 取消按钮操作 */
async function handleCancel(id: number) {
  try {
    // 操作的二次确认
    await message.confirm('确认取消用车申请？')
    // 执行业务操作
    await VehicleApplyApi.cancelVehicleApply(id)
    message.success('取消成功')
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
