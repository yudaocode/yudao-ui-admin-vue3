<template>
  <doc-alert title="【设备】点检记录、保养记录、维修单" url="https://doc.iocoder.cn/mes/dv/check-record/" />

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
        <el-select
          v-model="queryParams.result"
          placeholder="请选择维修结果"
          clearable
          class="!w-240px"
        >
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
      <el-table-column label="维修单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="维修单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="设备编码" align="center" prop="machineryCode" min-width="120" />
      <el-table-column label="设备名称" align="center" prop="machineryName" min-width="120" />
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
      <el-table-column label="维修结果" align="center" prop="result" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_RESULT" :value="scope.row.result" />
        </template>
      </el-table-column>
      <el-table-column
        label="维修人员"
        align="center"
        prop="acceptedUserNickname"
        min-width="100"
      />
      <el-table-column label="验收人员" align="center" prop="confirmUserNickname" min-width="100" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_DV_REPAIR_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:dv-repair:update']"
            v-if="scope.row.status === MesDvRepairStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:dv-repair:delete']"
            v-if="scope.row.status === MesDvRepairStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 维修中：完成维修 -->
          <el-button
            link
            type="success"
            @click="openForm('confirm', scope.row.id)"
            v-hasPermi="['mes:dv-repair:update']"
            v-if="scope.row.status === MesDvRepairStatusEnum.CONFIRMED"
          >
            完成维修
          </el-button>
          <!-- 待验收：验收 -->
          <el-button
            link
            type="success"
            @click="openForm('finish', scope.row.id)"
            v-hasPermi="['mes:dv-repair:update']"
            v-if="scope.row.status === MesDvRepairStatusEnum.APPROVING"
          >
            验收
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
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { DvRepairApi } from '@/api/mes/dv/repair'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import RepairForm from './RepairForm.vue'
import { MesDvRepairStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesDvRepair' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
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
const formRef = ref() // 表单弹窗

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

/** 添加/修改/详情/完成维修/验收操作 */
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

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
