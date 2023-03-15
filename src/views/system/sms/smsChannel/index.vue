<template>
  <ContentWrap>
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="短信签名" prop="signature">
        <el-input
          v-model="queryParams.signature"
          placeholder="请输入短信签名"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="启用状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择启用状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          @click="openModal('create')"
          v-hasPermi="['system:sms-channel:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增</el-button
        >
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['system:sms-channel:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" align="center">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="短信签名" align="center" prop="signature" />
      <el-table-column label="渠道编码" align="center" prop="code">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="scope.row.code" />
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column
        label="短信 API 的账号"
        align="center"
        prop="apiKey"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="短信 API 的密钥"
        align="center"
        prop="apiSecret"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="短信发送回调 URL"
        align="center"
        prop="callbackUrl"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['system:sms-channel:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:sms-channel:delete']"
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
  <!-- 表单弹窗：添加/修改 -->
  <SmsChannelForm ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="SmsChannel">
// 业务相关的 import
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
//格式化时间
import { dateFormatter } from '@/utils/formatTime'
//字典
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
//表单弹窗：添加/修改
import SmsChannelForm from './form.vue'
//下载
// import download from '@/utils/download'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

// 列表的加载中
const loading = ref(true)
//搜索的表单
const queryFormRef = ref()
// 列表的总页数
const total = ref(0)
// 列表的数据
const list = ref([])
//导出的加载中
const exportLoading = ref(false)
//查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  signature: undefined,
  status: undefined,
  createTime: []
})

/** 查询参数列表 */
const getList = async () => {
  loading.value = true
  // 执行查询
  try {
    const data = await SmsChannelApi.getSmsChannelPageApi(queryParams)
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

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    await message.info('该功能目前不支持')
    //导出功能先不考虑
    // const data = await SmsChannelApi.exportSmsChanelApi(queryParams)
    // download.excel(data, '短信渠道.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SmsChannelApi.deleteSmsChannelApi(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
