<!-- MES 物料产品列表 -->
<template>
  <doc-alert title="【基础】物料产品、分类、计量单位" url="https://doc.iocoder.cn/mes/md/product/" />

  <el-row :gutter="20">
    <!-- 左侧分类树 -->
    <el-col :span="4" :xs="24">
      <ContentWrap class="h-1/1">
        <MdItemTypeTree @node-click="handleTypeNodeClick" />
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
          label-width="68px"
        >
          <el-form-item label="物料编码" prop="code">
            <el-input
              v-model="queryParams.code"
              placeholder="请输入物料编码"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="物料名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入物料名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择状态"
              clearable
              class="!w-240px"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
              v-hasPermi="['mes:md-item:create']"
            >
              <Icon icon="ep:plus" class="mr-5px" /> 新增
            </el-button>
            <el-button
              type="warning"
              plain
              @click="handleImport"
              v-hasPermi="['mes:md-item:import']"
            >
              <Icon icon="ep:upload" class="mr-5px" /> 导入
            </el-button>
            <el-button
              type="success"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['mes:md-item:export']"
            >
              <Icon icon="ep:download" class="mr-5px" /> 导出
            </el-button>
          </el-form-item>
        </el-form>
      </ContentWrap>

      <!-- 列表 -->
      <ContentWrap>
        <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
          <el-table-column label="物料编码" align="center" prop="code">
            <template #default="scope">
              <el-link type="primary" @click="openForm('detail', scope.row.id)">
                {{ scope.row.code }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="物料名称" align="center" prop="name" />
          <el-table-column label="规格型号" align="center" prop="specification" />
          <el-table-column label="单位" align="center" prop="unitMeasureName" />
          <el-table-column label="物料分类" align="center" prop="itemTypeName" />
          <el-table-column label="物料/产品" align="center" prop="itemOrProduct">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="scope.row.itemOrProduct" />
            </template>
          </el-table-column>
          <el-table-column label="安全库存" align="center" prop="safeStockFlag">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.safeStockFlag" />
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="status" width="80">
            <template #default="scope">
              <el-switch
                v-model="scope.row.status"
                :active-value="0"
                :inactive-value="1"
                @change="handleStatusChange(scope.row)"
                :disabled="!checkPermi(['mes:md-item:update'])"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            align="center"
            prop="createTime"
            :formatter="dateFormatter"
            width="180px"
          />
          <el-table-column label="操作" align="center" width="200">
            <template #default="scope">
              <el-button
                link
                type="primary"
                @click="openForm('update', scope.row.id)"
                v-hasPermi="['mes:md-item:update']"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                @click="handleDelete(scope.row.id)"
                v-hasPermi="['mes:md-item:delete']"
              >
                删除
              </el-button>
              <PrinterLabel :bizId="scope.row.id" :bizCode="scope.row.code" bizType="ITEM" />
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
  <MdItemForm ref="formRef" @success="getList" />
  <!-- 物料导入对话框 -->
  <MdItemImportForm ref="importFormRef" @success="getList" />
  <!-- 条码详情弹窗 -->
  <BarcodeDetail ref="barcodeDetailRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CommonStatusEnum } from '@/utils/constants'
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import MdItemForm from './MdItemForm.vue'
import MdItemImportForm from './MdItemImportForm.vue'
import MdItemTypeTree from './type/components/MdItemTypeTree.vue'

import { BarcodeDetail, PrinterLabel } from '@/views/mes/wm/barcode/components'

defineOptions({ name: 'MesMdItem' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MdItemVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  itemTypeId: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MdItemApi.getItemPage(queryParams)
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
  queryParams.itemTypeId = undefined
  handleQuery()
}

/** 处理分类树节点点击 */
const handleTypeNodeClick = (row: any) => {
  queryParams.itemTypeId = row?.id
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 切换物料状态 */
const handleStatusChange = async (row: MdItemVO) => {
  try {
    // 修改状态的二次确认
    const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
    await message.confirm('确认要"' + text + '""' + row.name + '"物料吗?')
    // 发起修改状态
    await MdItemApi.updateItemStatus(row.id, row.status)
    // 刷新列表
    await getList()
  } catch {
    // 取消后，恢复按钮
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MdItemApi.deleteItem(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 物料导入 */
const importFormRef = ref()
const handleImport = () => {
  importFormRef.value.open()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await MdItemApi.exportItem(queryParams)
    download.excel(data, '物料产品.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
