<template>
  <!-- 搜索工作栏 -->
  <content-wrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="错误码类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择错误码类型" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_ERROR_CODE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
            class="!w-240px"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="应用名" prop="applicationName">
        <el-input
          v-model="queryParams.applicationName"
          placeholder="请输入应用名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="错误码编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入错误码编码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="错误码提示" prop="message">
        <el-input
          v-model="queryParams.message"
          placeholder="请输入错误码提示"
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
        <el-button
          type="primary"
          @click="openModal('create')"
          v-hasPermi="['system:error-code:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:error-code:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="类型" align="center" prop="type" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_ERROR_CODE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="应用名" align="center" prop="applicationName" width="200" />
      <el-table-column label="错误码编码" align="center" prop="code" width="120" />
      <el-table-column label="错误码提示" align="center" prop="message" width="300" />
      <el-table-column label="备注" align="center" prop="memo" width="200" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['system:error-code:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:error-code:delete']"
          >
            删除
          </el-button>
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
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <error-code-form ref="modalRef" @success="getList" />
</template>

<script setup lang="ts" name="ErrorCode">
import * as ErrorCodeApi from '@/api/system/errorCode'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import ErrorCodeForm from './form.vue'
import download from '@/utils/download'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

// 遮罩层
const loading = ref(true)
// 导出遮罩层
const exportLoading = ref(false)
// 总条数
const total = ref(0)
// 错误码列表
const list = ref([])
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined,
  applicationName: undefined,
  code: undefined,
  message: undefined,
  createTime: []
})
// 搜索的表单
const queryFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  // 执行查询
  try {
    const data = await ErrorCodeApi.getErrorCodePageApi(queryParams)
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
    await ErrorCodeApi.deleteErrorCodeApi(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ErrorCodeApi.excelErrorCodeApi(queryParams)
    download.excel(data, '错误码.xls')
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
