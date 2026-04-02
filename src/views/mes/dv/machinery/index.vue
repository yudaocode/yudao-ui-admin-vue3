<!-- MES 设备台账列表 -->
<template>
  <el-row :gutter="20">
    <!-- 左侧分类树 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <MachineryTypeTree @node-click="handleTypeNodeClick" />
      </ContentWrap>
    </el-col>
    <el-col :span="20" :xs="24">
      <ContentWrap>
        <!-- 搜索工作栏 -->
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="100px"
        >
          <el-form-item label="设备编码" prop="code">
            <el-input
              v-model="queryParams.code"
              placeholder="请输入设备编码"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="设备名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入设备名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="所属车间" prop="workshopId">
            <el-select
              v-model="queryParams.workshopId"
              placeholder="请选择所属车间"
              clearable
              class="!w-240px"
            >
              <el-option
                v-for="item in workshopList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="设备状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择状态"
              clearable
              class="!w-240px"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_MACHINERY_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"
              ><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button
            >
            <el-button @click="resetQuery"
              ><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button
            >
            <el-button
              type="primary"
              plain
              @click="openForm('create')"
              v-hasPermi="['mes:dv-machinery:create']"
            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增
            </el-button>
            <el-button
              type="warning"
              plain
              @click="handleImport"
              v-hasPermi="['mes:dv-machinery:import']"
            >
              <Icon icon="ep:upload" class="mr-5px" /> 导入
            </el-button>
            <el-button
              type="success"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['mes:dv-machinery:export']"
            >
              <Icon icon="ep:download" class="mr-5px" /> 导出
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
          <el-table-column label="设备编码" align="center" prop="code" width="120">
            <template #default="scope">
              <el-link type="primary" @click="openForm('detail', scope.row.id)">
                {{ scope.row.code }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="设备名称" align="center" prop="name" min-width="150" />
          <el-table-column label="品牌" align="center" prop="brand" width="100" />
          <el-table-column label="规格型号" align="center" prop="spec" width="120" />
          <el-table-column label="设备类型" align="center" prop="machineryTypeName" width="120" />
          <el-table-column label="所属车间" align="center" prop="workshopName" width="120" />
          <el-table-column label="设备状态" align="center" prop="status" width="100">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.MES_DV_MACHINERY_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            align="center"
            prop="createTime"
            :formatter="dateFormatter"
            width="180px"
          />
          <el-table-column label="操作" align="center" width="170">
            <template #default="scope">
              <el-button
                link
                type="primary"
                @click="openForm('update', scope.row.id)"
                v-hasPermi="['mes:dv-machinery:update']"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                @click="handleDelete(scope.row.id)"
                v-hasPermi="['mes:dv-machinery:delete']"
              >
                删除
              </el-button>
              <el-button
                link
                type="primary"
                @click="handleBarcode(scope.row)"
                v-hasPermi="['mes:dv-machinery:query']"
              >
                条码
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
    </el-col>
  </el-row>

  <!-- 表单弹窗：添加/修改 -->
  <MachineryForm ref="formRef" @success="getList" />
  <!-- 设备导入对话框 -->
  <MachineryImportForm ref="importFormRef" @success="getList" />
  <!-- 条码详情弹窗 -->
  <BarcodeDetail ref="barcodeDetailRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { DvMachineryApi, DvMachineryVO } from '@/api/mes/dv/machinery'
import { MdWorkshopApi, MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import MachineryForm from './MachineryForm.vue'
import MachineryTypeTree from './MachineryTypeTree.vue'
import MachineryImportForm from './MachineryImportForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BarcodeDetail } from '@/views/mes/wm/barcode/components'
import { BarcodeBizTypeEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesDvMachinery' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<DvMachineryVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  machineryTypeId: undefined,
  workshopId: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const workshopList = ref<MdWorkshopVO[]>([]) // 车间列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvMachineryApi.getMachineryPage(queryParams)
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
  queryParams.machineryTypeId = undefined
  handleQuery()
}

/** 处理分类树节点点击 */
const handleTypeNodeClick = (row: any) => {
  queryParams.machineryTypeId = row?.id
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
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DvMachineryApi.deleteMachinery(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 查看设备条码 */
const barcodeDetailRef = ref()
const handleBarcode = async (row: DvMachineryVO) => {
  await barcodeDetailRef.value.openByBusiness(
    row.id,
    BarcodeBizTypeEnum.MACHINERY,
    row.code,
    row.name
  )
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await DvMachineryApi.exportMachinery(queryParams)
    download.excel(data, '设备台账.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 设备导入 */
const importFormRef = ref()
const handleImport = () => {
  importFormRef.value.open()
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 加载车间列表
  workshopList.value = await MdWorkshopApi.getWorkshopSimpleList()
})
</script>
