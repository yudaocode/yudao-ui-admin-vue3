<template>
  <content-wrap>
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
      ><el-form-item label="商户号" prop="no">
        <el-input v-model="queryParams.no" placeholder="请输入商户号" clearable />
      </el-form-item>
      <el-form-item label="商户全称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入商户全称" clearable />
      </el-form-item>
      <el-form-item label="商户简称" prop="shortName">
        <el-input v-model="queryParams.shortName" placeholder="请输入商户简称" clearable />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="字典状态" clearable class="!w-240px">
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="queryParams.remark" placeholder="请输入备注" clearable />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          style="width: 240px"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="openModal('create')"
          v-hasPermi="['pay:merchant:create']"
          >新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          :loading="exportLoading"
          @click="handleExport"
          v-hasPermi="['pay:merchant:export']"
          >导出</el-button
        >
      </el-col>
    </el-row>
  </content-wrap>
  <content-wrap>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="商户编号" align="center" prop="id" />
      <el-table-column label="商户号" align="center" prop="no" />
      <el-table-column label="商户全称" align="center" prop="name" />
      <el-table-column label="商户简称" align="center" prop="shortName" />
      <el-table-column label="开启状态" align="center" prop="status">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="创建时间"
        :formatter="dateFormatter"
        align="center"
        prop="createTime"
        width="180"
      />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="el-icon-edit"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['pay:merchant:update']"
            >修改</el-button
          >
          <el-button
            link
            type="danger"
            icon="el-icon-delete"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['pay:merchant:delete']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
    <!-- 表单弹窗：添加/修改 -->
    <MerchantForm ref="modalRef" @success="getList" />
  </content-wrap>
</template>

<script setup lang="ts" name="Merchant">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import * as MerchantApi from '@/api/pay/merchant'
import MerchantForm from './form.vue'
import download from '@/utils/download'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  name: '',
  shortName: '',
  status: undefined,
  pageNo: 1,
  pageSize: 100
})
const queryFormRef = ref() // 搜索的表单
const showSearch = ref(true)
const exportLoading = ref(false) // 导出的加载中
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MerchantApi.getMerchantPageApi(queryParams)

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
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MerchantApi.deleteMerchantApi(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

// 启用状态修改
const handleStatusChange = (row: MerchantApi.MerchantVO) => {
  let info = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  message
    .confirm('确认要"' + info + '""' + row.name + '"商户吗?', t('common.reminder'))
    .then(async () => {
      row.status =
        row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE
      await MerchantApi.updateMerchantApi(row)
      message.success(info + '成功')
      // 刷新列表
      getList()
    })
    .catch(() => {
      row.status =
        row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
    })
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await MerchantApi.exportMerchantApi(queryParams)
    download.excel(data, '商户信息.xls')
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
