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
      <!-- TODO @AI：采购订单编号 -->
      <!-- TODO @AI：供应商筛选 -->
      <!-- TODO @AI：去掉 returnDate、status；包括前后端； -->
      <el-form-item label="退货日期" prop="returnDate">
        <el-date-picker
          v-model="queryParams.returnDate"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择单据状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MES_RETURN_VENDOR_STATUS)"
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
          v-hasPermi="['mes:wm-return-vendor:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-return-vendor:export']"
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
      <el-table-column label="采购订单号" align="center" prop="poCode" min-width="140" />
      <!-- TODO @AI：拆成供应商编码、供应商名称 -->
      <el-table-column label="供应商" align="center" prop="vendorName" min-width="150" />
      <!-- TODO @AI：去掉 batchCode 字段-->
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column
        label="退货日期"
        align="center"
        prop="returnDate"
        :formatter="dateFormatter2"
        width="180px"
      />
      <!-- TODO @AI：去掉 returnReason 字段-->
      <el-table-column label="退货原因" align="center" prop="returnReason" min-width="150" />
      <el-table-column label="单据状态" align="center" prop="status" min-width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_RETURN_VENDOR_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="240" fixed="right">
        <template #default="scope">
          <!-- 草稿：编辑、提交、删除 -->
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['mes:wm-return-vendor:update']"
            v-if="scope.row.status === MesWmReturnVendorStatusEnum.PREPARE"
          >
            编辑
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleSubmit(scope.row.id)"
            v-hasPermi="['mes:wm-return-vendor:update']"
            v-if="scope.row.status === MesWmReturnVendorStatusEnum.PREPARE"
          >
            提交
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-return-vendor:delete']"
            v-if="scope.row.status === MesWmReturnVendorStatusEnum.PREPARE"
          >
            删除
          </el-button>
          <!-- 待拣货：执行拣货 -->
          <el-button
            link
            type="success"
            @click="openForm('stock', scope.row.id)"
            v-hasPermi="['mes:wm-return-vendor:update']"
            v-if="scope.row.status === MesWmReturnVendorStatusEnum.APPROVING"
          >
            执行拣货
          </el-button>
          <!-- 待执行退货：完成 -->
          <el-button
            link
            type="success"
            @click="handleFinish(scope.row.id)"
            v-hasPermi="['mes:wm-return-vendor:update-status']"
            v-if="scope.row.status === MesWmReturnVendorStatusEnum.APPROVED"
          >
            完成
          </el-button>
          <!-- 待拣货、待执行退货：取消 -->
          <el-button
            link
            type="danger"
            @click="handleCancel(scope.row.id)"
            v-hasPermi="['mes:wm-return-vendor:update']"
            v-if="
              [
                MesWmReturnVendorStatusEnum.APPROVING,
                MesWmReturnVendorStatusEnum.APPROVED
              ].includes(scope.row.status)
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

  <ReturnVendorForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import download from '@/utils/download'
import { WmReturnVendorApi, WmReturnVendorVO } from '@/api/mes/wm/returnvendor'
import ReturnVendorForm from './ReturnVendorForm.vue'
import { MesWmReturnVendorStatusEnum } from '@/views/mes/utils/constants'

defineOptions({ name: 'MesWmReturnVendor' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<WmReturnVendorVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const exportLoading = ref(false) // 导出的加载中
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined,
  status: undefined,
  returnDate: undefined
})
const queryFormRef = ref() // 搜索的表单
const formRef = ref() // 表单弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmReturnVendorApi.getReturnVendorPage(queryParams)
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
    await message.confirm('确认提交该退货单？')
    await WmReturnVendorApi.submitReturnVendor(id)
    message.success('提交成功')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmReturnVendorApi.deleteReturnVendor(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 取消按钮操作 */
const handleCancel = async (id: number) => {
  try {
    await message.confirm('确认取消该供应商退货单？取消后不可恢复。')
    await WmReturnVendorApi.cancelReturnVendor(id)
    message.success('取消成功')
    await getList()
  } catch {}
}

/** 完成按钮操作 */
const handleFinish = async (id: number) => {
  try {
    await message.confirm('确认完成该退货单并执行退货？')
    await WmReturnVendorApi.finishReturnVendor(id)
    message.success('完成成功')
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await WmReturnVendorApi.exportReturnVendor(queryParams)
    download.excel(data, '供应商退货单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>
