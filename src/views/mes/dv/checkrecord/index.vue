<template>
  <doc-alert title="【设备】点检记录、保养记录、维修单" url="https://doc.iocoder.cn/mes/check-record/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="点检计划" prop="planId">
        <DvCheckPlanSelect v-model="queryParams.planId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="设备" prop="machineryId">
        <DvMachinerySelect v-model="queryParams.machineryId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="点检人" prop="userId">
        <UserSelectV2 v-model="queryParams.userId" placeholder="请选择点检人" class="!w-240px" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_CHECK_RECORD_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="点检时间" prop="checkTime">
        <el-date-picker
          v-model="queryParams.checkTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:dv-check-record:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:dv-check-record:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="设备编码" align="center" prop="machineryCode" min-width="140">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.machineryCode }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="设备名称" align="center" prop="machineryName" min-width="120" />
      <el-table-column label="品牌" align="center" prop="machineryBrand" />
      <el-table-column label="规格型号" align="center" prop="machinerySpecification" min-width="120" />
      <el-table-column label="计划编码" align="center" prop="planCode" min-width="120" />
      <el-table-column label="计划名称" align="center" prop="planName" min-width="120" />
      <el-table-column
        label="点检时间"
        align="center"
        prop="checkTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="点检人" align="center" prop="nickname" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_CHECK_RECORD_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:dv-check-record:update']"
            v-if="scope.row.status === MesDvCheckRecordStatusEnum.DRAFT"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:dv-check-record:delete']"
            v-if="scope.row.status === MesDvCheckRecordStatusEnum.DRAFT"
          >
            删除
          </el-button>
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
  </ContentWrap>

  <!-- 表单弹窗 -->
  <CheckRecordForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { DvCheckRecordApi } from '@/api/mes/dv/checkrecord'
import CheckRecordForm from './CheckRecordForm.vue'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import DvCheckPlanSelect from '@/views/mes/dv/checkplan/components/DvCheckPlanSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import { MesDvCheckRecordStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesDvCheckRecord' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  planId: undefined,
  machineryId: undefined,
  userId: undefined,
  status: undefined,
  checkTime: []
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvCheckRecordApi.getCheckRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvCheckRecordApi.deleteCheckRecord(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DvCheckRecordApi.exportCheckRecord(queryParams)
    download.excel(data, '设备点检记录.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
