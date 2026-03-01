<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="退货单编号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入退货单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="退货单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入退货单名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户" prop="clientId">
        <MdClientSelect v-model="queryParams.clientId" clearable class="!w-240px" />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择单据状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_RETURN_SALES_STATUS)"
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
          v-hasPermi="['mes:wm-return-sales:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-return-sales:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="退货单编号" align="center" prop="code" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('detail', scope.row.id)">
            {{ scope.row.code }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="退货单名称" align="center" prop="name" min-width="150" />
      <el-table-column label="销售订单号" align="center" prop="salesOrderCode" min-width="140" />
      <el-table-column label="客户编码" align="center" prop="clientCode" min-width="120" />
      <el-table-column label="客户名称" align="center" prop="clientName" min-width="150" />
      <el-table-column label="退货原因" align="center" prop="returnReason" min-width="150" />
      <el-table-column
        label="退货日期"
        align="center"
        prop="returnDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <el-table-column label="单据状态" align="center" prop="status" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_RETURN_SALES_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          {{ scope.row.status }}
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-return-sales:update']"
            v-if="scope.row.status === MesWmReturnSalesStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-return-sales:submit']"
            v-if="scope.row.status === MesWmReturnSalesStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-return-sales:delete']"
            v-if="scope.row.status === MesWmReturnSalesStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- DONE @AI：执行退货、执行上架；是不是状态判断错了；（状态判断正确：APPROVING=待执行→执行退货，APPROVED=待上架→执行上架） -->
          <!-- 待执行：执行退货 -->
          <el-button
            link
            type="primary"
            @click="handleExecute(scope.row.id)"
            v-hasPermi="['mes:wm-return-sales:execute']"
            v-if="scope.row.status === MesWmReturnSalesStatusEnum.APPROVING"
          >
            执行退货
          </el-button>
          <!-- 待上架：执行上架 -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-return-sales:stock']"
            v-if="scope.row.status === MesWmReturnSalesStatusEnum.APPROVED"
          >
            执行上架
          </el-button>
          <!-- 待执行、待上架：取消 -->
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-return-sales:cancel']"
            v-if="
              [MesWmReturnSalesStatusEnum.APPROVING, MesWmReturnSalesStatusEnum.APPROVED].includes(
                scope.row.status
              )
            "
          >
            取消
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <ReturnSalesForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmReturnSalesApi, WmReturnSalesVO } from '@/api/mes/wm/returnsales'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import ReturnSalesForm from './ReturnSalesForm.vue'
import { MesWmReturnSalesStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmReturnSales' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmReturnSalesVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  clientId: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmReturnSalesApi.getReturnSalesPage(queryParams)
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

/** 提交按钮操作 */
const handleSubmit = async (id: number) => {
  try {
    await message.confirm('确认提交该销售退货单？')
    await WmReturnSalesApi.submitReturnSales(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 执行退货 */
const handleExecute = async (id: number) => {
  try {
    await message.confirm('确认执行退货？')
    await WmReturnSalesApi.executeReturnSales(id)
    message.success('执行成功')
    await getList()
  } catch {}
}

/** 取消 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该销售退货单？取消后不可恢复。')
    await WmReturnSalesApi.cancelReturnSales(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmReturnSalesApi.deleteReturnSales(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 导出 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmReturnSalesApi.exportReturnSales(queryParams)
    download.excel(data, '销售退货单.xls')
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
