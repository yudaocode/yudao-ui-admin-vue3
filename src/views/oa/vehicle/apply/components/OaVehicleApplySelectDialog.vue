<template>
  <Dialog v-model="dialogVisible" title="选择用车申请单" width="1200px" append-to-body>
    <!-- 搜索 -->
    <ContentWrap>
      <el-form
        ref="queryFormRef"
        class="-mb-15px"
        :model="queryParams"
        :inline="true"
        label-width="85px"
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
        <el-form-item label="车辆" prop="vehicleNo">
          <el-input
            v-model="queryParams.vehicleNo"
            placeholder="请输入车牌号"
            clearable
            class="!w-240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>
    <!-- 列表 -->
    <ContentWrap>
      <el-table
        v-loading="loading"
        :data="list"
        stripe
        show-overflow-tooltip
        row-key="id"
        @row-click="handleSelect"
      >
        <el-table-column label="选择" width="60" align="center">
          <template #default="{ row }">
            <el-radio
              :model-value="selectedItem?.id"
              :value="row.id"
              :aria-label="'选择申请 ' + row.no"
              @change="handleSelect(row)"
            >
              <span> </span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="单据编号" prop="no" min-width="200" />
        <el-table-column label="车牌号" prop="vehicleNo" width="120" />
        <el-table-column label="用车事由" prop="reason" min-width="160" />
        <el-table-column label="出车时间" prop="startTime" :formatter="dateFormatter" width="180" />
        <el-table-column label="回车时间" prop="endTime" :formatter="dateFormatter" width="180" />
        <el-table-column label="申请人" prop="userName" width="120" />
        <el-table-column label="部门" prop="deptName" min-width="140" />
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
    <template #footer>
      <el-button type="primary" :disabled="loading || !selectedItem" @click="submitForm">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as VehicleApplyApi from '@/api/oa/vehicle/apply'
import { dateFormatter } from '@/utils/formatTime'

defineOptions({ name: 'OaVehicleApplySelectDialog' })

const props = defineProps<{
  status?: number // 审批状态，由调用方限定可选范围
  returnStatus?: number // 还车状态，由调用方限定可选范围
}>()

const emit = defineEmits<{
  selected: [item: VehicleApplyApi.VehicleApplyVO]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表的加载中
const list = ref<VehicleApplyApi.VehicleApplyVO[]>([]) // 申请列表
const total = ref(0) // 列表的总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined as string | undefined,
  vehicleNo: undefined as string | undefined
})
const queryFormRef = ref() // 搜索的表单
const selectedItem = ref<VehicleApplyApi.VehicleApplyVO>() // 当前选中的申请，翻页时保留

/** 打开弹窗，恢复当前申请选择 */
function open(item?: VehicleApplyApi.VehicleApplyVO) {
  dialogVisible.value = true
  queryParams.pageNo = 1
  queryParams.no = undefined
  queryParams.vehicleNo = undefined
  selectedItem.value = item
  getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询本人用车申请列表 */
async function getList() {
  loading.value = true
  try {
    const params = { ...queryParams, status: props.status, returnStatus: props.returnStatus }
    const data = await VehicleApplyApi.getVehicleApplyPage(params)
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

/** 选择申请 */
function handleSelect(item: VehicleApplyApi.VehicleApplyVO) {
  selectedItem.value = item
}

/** 确认选择 */
function submitForm() {
  if (!selectedItem.value) return
  emit('selected', selectedItem.value)
  dialogVisible.value = false
}
</script>
