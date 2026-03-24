<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="维修单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入维修单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="维修单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入维修单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="设备" prop="machineryId">
        <DvMachinerySelect v-model="queryParams.machineryId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="维修结果" prop="result">
        <el-select v-model="queryParams.result" placeholder="请选择维修结果" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="单据状态" prop="status" width="100">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_REPAIR_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['mes:dv-repair:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:dv-repair:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="维修单编号" align="center" prop="code" />
      <el-table-column label="维修单名称" align="center" prop="name" />
      <el-table-column label="设备编码" align="center" prop="machineryCode" />
      <el-table-column label="设备名称" align="center" prop="machineryName" />
      <el-table-column
        label="报修日期"
        align="center"
        prop="requireDate"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="维修完成日期"
        align="center"
        prop="finishDate"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="验收日期"
        align="center"
        prop="confirmDate"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="维修结果" align="center" prop="result">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="scope.row.result" />
        </template>
      </el-table-column>
      <el-table-column label="维修人员" align="center" prop="acceptedUserNickname" />
      <el-table-column label="验收人员" align="center" prop="confirmUserNickname" />
      <el-table-column label="单据状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="220"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-if="scope.row.status === MesDvRepairStatusEnum.DRAFT"
            v-hasPermi="['mes:dv-repair:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="handleConfirm(scope.row.id)"
            v-if="scope.row.status === MesDvRepairStatusEnum.DRAFT"
            v-hasPermi="['mes:dv-repair:update']"
          >
            通过
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleReject(scope.row.id)"
            v-if="scope.row.status === MesDvRepairStatusEnum.DRAFT"
            v-hasPermi="['mes:dv-repair:update']"
          >
            不通过
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-if="scope.row.status === MesDvRepairStatusEnum.DRAFT"
            v-hasPermi="['mes:dv-repair:delete']"
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
  <RepairForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DvRepairApi } from '@/api/mes/dv/repair'
import RepairForm from './RepairForm.vue'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MesDvRepairStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesDvRepair' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  machineryId: undefined,
  result: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvRepairApi.getRepairPage(queryParams)
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
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 通过按钮操作 */
const handleConfirm = async (id: number) => {
  try {
    await message.confirm('确认通过该维修工单吗？')
    await DvRepairApi.confirmRepair(id)
    message.success('操作成功')
    await getList()
  } catch {}
}

/** 不通过按钮操作 */
const handleReject = async (id: number) => {
  try {
    await message.confirm('确认不通过该维修工单吗？')
    await DvRepairApi.rejectRepair(id)
    message.success('操作成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvRepairApi.deleteRepair(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DvRepairApi.exportRepair(queryParams)
    download.excel(data, '维修工单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
