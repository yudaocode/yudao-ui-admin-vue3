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
      label-width="120px"
    >
      <el-form-item label="所属部门" prop="deptId">
        <DeptSelect v-model="queryParams.deptId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="车牌号" prop="no">
        <el-input
          v-model="queryParams.no"
          placeholder="请输入车牌号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="车辆名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入车辆名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择分类"
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
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_VEHICLE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
      <el-form-item label="品牌型号" prop="brandModel">
        <el-input
          v-model="queryParams.brandModel"
          placeholder="请输入品牌型号"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="交强险到期时间" prop="compulsoryInsuranceExpireTime">
        <el-date-picker
          v-model="queryParams.compulsoryInsuranceExpireTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="商业险到期时间" prop="commercialInsuranceExpireTime">
        <el-date-picker
          v-model="queryParams.commercialInsuranceExpireTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="年检到期时间" prop="inspectionExpireTime">
        <el-date-picker
          v-model="queryParams.inspectionExpireTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
        <el-button
          v-hasPermi="['oa:vehicle:create']"
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
      <el-table-column label="所属部门" prop="deptName" min-width="140" show-overflow-tooltip />
      <el-table-column label="车牌号" prop="no" min-width="140" />
      <el-table-column label="车辆名称" prop="name" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.OA_VEHICLE_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="车辆照片" prop="picUrl" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.picUrl"
            :src="row.picUrl"
            :preview-src-list="[row.picUrl]"
            preview-teleported
            fit="cover"
            class="h-40px w-40px"
          />
        </template>
      </el-table-column>
      <el-table-column label="车型" prop="type" min-width="100" show-overflow-tooltip />
      <el-table-column label="分类" prop="category" min-width="120">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.OA_VEHICLE_CATEGORY" :value="row.category" />
        </template>
      </el-table-column>
      <el-table-column label="品牌型号" prop="brandModel" min-width="130" show-overflow-tooltip />
      <el-table-column label="座位数" prop="seatCount" width="90" />
      <el-table-column label="裸车价格（元）" prop="barePrice" width="140" />
      <el-table-column
        label="交强险到期时间"
        prop="compulsoryInsuranceExpireTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="商业险到期时间"
        prop="commercialInsuranceExpireTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="年检到期时间"
        prop="inspectionExpireTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="显示顺序" prop="sort" width="100" />
      <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" fixed="right" width="160">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['oa:vehicle:update']"
            link
            type="primary"
            @click="openForm('update', row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['oa:vehicle:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
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

  <!-- 新增和修改表单 -->
  <OaVehicleForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as VehicleApi from '@/api/oa/vehicle'
import OaVehicleForm from './OaVehicleForm.vue'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'

defineOptions({ name: 'OaVehicle' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(false) // 列表加载状态
const list = ref<VehicleApi.VehicleVO[]>([]) // 列表数据
const total = ref(0) // 总记录数
const queryParams = reactive({
  // 搜索参数
  pageNo: 1,
  pageSize: 10,
  no: '',
  name: '',
  category: '',
  deptId: undefined,
  status: undefined,
  type: undefined,
  brandModel: undefined,
  compulsoryInsuranceExpireTime: [],
  commercialInsuranceExpireTime: [],
  inspectionExpireTime: []
})
const queryFormRef = ref() // 搜索表单
const formRef = ref() // 新增和修改表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await VehicleApi.getVehiclePage(queryParams)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 打开弹窗 */
function openForm(type: string, id?: number) {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await VehicleApi.deleteVehicle(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
