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
      <!-- TODO @AI：维修单编号 -->
      <el-form-item label="工单编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工单编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <!-- TODO @AI：维修单名称 -->
      <el-form-item label="工单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="设备" prop="machineryId">
        <DvMachinerySelect v-model="queryParams.machineryId" class="!w-240px" />
      </el-form-item>
      <!-- TODO @AI:维修结果 -->
      <!-- TODO @AI:单据状态 -->
      <!-- TODO @AI：报修日期，不用这个字段 -->
      <el-form-item label="报修日期" prop="requireDate">
        <el-date-picker
          v-model="queryParams.requireDate"
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
      <!-- TODO @AI：维修单编码 -->
      <!-- TODO @AI：维修单名称 -->
      <el-table-column label="工单编码" align="center" prop="code" />
      <el-table-column label="工单名称" align="center" prop="name" />
      <el-table-column label="设备编码" align="center" prop="machineryCode" />
      <el-table-column label="设备名称" align="center" prop="machineryName" />
      <!-- TODO @AI:保修日期 -->
      <!-- TODO @AI:保修完成日期 -->
      <!-- TODO @AI:验收日期 -->
      <!-- TODO @AI:维修结果 -->
      <el-table-column label="维修人员" align="center" prop="acceptedUserNickname" />
      <el-table-column label="验收人员" align="center" prop="acceptedUserNickname" />
      <el-table-column label="单据状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:dv-repair:update']"
          >
            编辑
          </el-button>
          <!-- TODO @AI：通过 -->
          <!-- TODO @AI：不通过 -->
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
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
import download from '@/utils/download'
import { DvRepairApi } from '@/api/mes/dv/repair'
import RepairForm from './RepairForm.vue'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import { DICT_TYPE } from '@/utils/dict'

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
  requireDate: []
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
