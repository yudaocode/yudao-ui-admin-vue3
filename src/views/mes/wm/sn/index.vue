<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="SN 码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入 SN 码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="物料" prop="itemId">
        <MdItemSelect v-model="queryParams.itemId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="批次号" prop="batchCode">
        <el-input
          v-model="queryParams.batchCode"
          placeholder="请输入批次号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
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
        <el-button type="primary" plain @click="openForm()" v-hasPermi="['mes:wm-sn:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 生成 SN 码
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['mes:wm-sn:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="SN 码数量" align="center" prop="count" min-width="100" />
      <el-table-column
        label="生成时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="180" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleExportDetail(scope.row.uuid)"
            v-hasPermi="['mes:wm-sn:export']"
          >
            导出明细
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.uuid)"
            v-hasPermi="['mes:wm-sn:delete']"
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

  <!-- 表单弹窗：生成 SN 码 -->
  <WmSnGenerateForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as WmSnApi from '@/api/mes/wm/sn'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmSnGenerateForm from './WmSnGenerateForm.vue'

defineOptions({ name: 'MesWmSn' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<WmSnApi.WmSnGroupVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({ // 查询参数
  pageNo: 1,
  pageSize: 10,
  uuid: undefined,
  code: undefined,
  itemId: undefined,
  batchCode: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmSnApi.getSnGroupPage(queryParams)
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
const formRef = ref() // 表单 Ref
const openForm = () => {
  formRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (uuid: string) => {
  try {
    await message.delConfirm()
    await WmSnApi.deleteSnBatch(uuid)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 导出分组按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await WmSnApi.exportSnGroupExcel(queryParams)
    download.excel(data, 'SN码分组.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 导出批次明细按钮操作 */
const handleExportDetail = async (uuid: string) => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    const data = await WmSnApi.exportSnDetailExcel(uuid)
    download.excel(data, 'SN码明细.xls')
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
