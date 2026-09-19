<template>
  <Dialog v-model="dialogVisible" title="选择车辆" width="1200px" append-to-body>
    <!-- 搜索 -->
    <ContentWrap>
      <el-form
        ref="queryFormRef"
        class="-mb-15px"
        :model="queryParams"
        :inline="true"
        label-width="85px"
      >
        <el-form-item label="车牌号" prop="no">
          <el-input
            v-model="queryParams.no"
            placeholder="请输入车牌号"
            clearable
            class="!w-240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="品牌型号" prop="brandModel">
          <el-input
            v-model="queryParams.brandModel"
            placeholder="请输入品牌型号"
            clearable
            class="!w-240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="车型" prop="type">
          <el-input
            v-model="queryParams.type"
            placeholder="请输入车型"
            clearable
            class="!w-240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="车辆分类" prop="category">
          <el-select
            v-model="queryParams.category"
            placeholder="请选择车辆分类"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getStrDictOptions(DICT_TYPE.OA_VEHICLE_CATEGORY)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
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
              :aria-label="'选择车辆 ' + row.no"
              @change="handleSelect(row)"
            >
              <span> </span>
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="车牌号" prop="no" min-width="130" />
        <el-table-column label="车辆名称" prop="name" min-width="160" />
        <el-table-column label="品牌型号" prop="brandModel" min-width="150" />
        <el-table-column label="车型" prop="type" min-width="100" />
        <el-table-column label="车辆分类" min-width="120">
          <template #default="{ row }">
            <DictTag :type="DICT_TYPE.OA_VEHICLE_CATEGORY" :value="row.category" />
          </template>
        </el-table-column>
        <el-table-column label="座位数" prop="seatCount" width="90" />
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
import type { VehicleVO } from '@/api/oa/vehicle'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'

defineOptions({ name: 'OaVehicleSelectDialog' })

const emit = defineEmits<{
  selected: [item: VehicleVO]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表的加载中
const list = ref<VehicleVO[]>([]) // 车辆列表
const total = ref(0) // 列表的总条数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: undefined as string | undefined,
  brandModel: undefined as string | undefined,
  type: undefined as string | undefined,
  category: undefined as string | undefined
})
const queryFormRef = ref() // 搜索的表单
const selectedItem = ref<VehicleVO>() // 当前选中的车辆，翻页时保留

/** 打开弹窗，恢复当前车辆选择 */
function open(item?: VehicleVO) {
  dialogVisible.value = true
  queryParams.pageNo = 1
  queryParams.no = undefined
  queryParams.brandModel = undefined
  queryParams.type = undefined
  queryParams.category = undefined
  selectedItem.value = item
  getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询用车申请可选车辆 */
async function getList() {
  loading.value = true
  try {
    const data = await VehicleApplyApi.getAvailableVehiclePage(queryParams)
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

/** 选择车辆 */
function handleSelect(item: VehicleVO) {
  selectedItem.value = item
}

/** 确认选择 */
function submitForm() {
  if (!selectedItem.value) return
  emit('selected', selectedItem.value)
  dialogVisible.value = false
}
</script>
