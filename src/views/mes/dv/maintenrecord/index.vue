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
      <!-- DONE @AI：计划 select；如果没组件，就封装一个； -->
      <el-form-item label="保养计划" prop="planId">
        <DvCheckPlanSelect v-model="queryParams.planId" class="!w-240px" />
      </el-form-item>
      <!-- DONE @AI：设备 select；如果没组件，就封装一个； -->
      <el-form-item label="设备" prop="machineryId">
        <DvMachinerySelect v-model="queryParams.machineryId" class="!w-240px" />
      </el-form-item>
      <!-- DONE @AI：用户 select；如果没组件，就封装一个 -->
      <el-form-item label="保养人" prop="userId">
        <UserSelect v-model="queryParams.userId" placeholder="请选择保养人" class="!w-240px" />
      </el-form-item>
      <el-form-item label="保养时间" prop="maintenTime">
        <el-date-picker
          v-model="queryParams.maintenTime"
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
          v-hasPermi="['mes:dv-mainten-record:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:dv-mainten-record:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="设备编码" align="center" prop="machineryCode" />
      <el-table-column label="设备名称" align="center" prop="machineryName" />
      <el-table-column label="品牌" align="center" prop="machineryBrand" />
      <el-table-column label="规格型号" align="center" prop="machinerySpec" />
      <el-table-column label="计划名称" align="center" prop="planName" />
      <el-table-column
        label="保养时间"
        align="center"
        prop="maintenTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="保养人" align="center" prop="nickname" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:dv-mainten-record:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="success"
            @click="handleSubmit(scope.row)"
            v-if="scope.row.status === 0"
            v-hasPermi="['mes:dv-mainten-record:update']"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:dv-mainten-record:delete']"
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
  <MaintenRecordForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DvMaintenRecordApi } from '@/api/mes/dv/maintenrecord'
import MaintenRecordForm from './MaintenRecordForm.vue'
import DvMachinerySelect from '@/views/mes/dv/machinery/components/DvMachinerySelect.vue'
import DvCheckPlanSelect from '@/views/mes/dv/checkplan/components/DvCheckPlanSelect.vue'
import UserSelect from '@/views/system/user/components/UserSelect.vue'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'MesDvMaintenRecord' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  planId: undefined,
  machineryId: undefined,
  userId: undefined,
  maintenTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvMaintenRecordApi.getMaintenRecordPage(queryParams)
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

/** 提交按钮操作 */
const handleSubmit = async (row: any) => {
  try {
    await message.confirm('确认提交该保养记录吗？')
    await DvMaintenRecordApi.updateMaintenRecord({ ...row, status: 1 })
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DvMaintenRecordApi.deleteMaintenRecord(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DvMaintenRecordApi.exportMaintenRecord(queryParams)
    download.excel(data, '设备保养记录.xls')
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
