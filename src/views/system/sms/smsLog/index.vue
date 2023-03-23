<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form
      :model="queryParams"
      ref="queryForm"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="手机号" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          placeholder="请输入手机号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="短信渠道" prop="channelId">
        <el-select v-model="queryParams.channelId" placeholder="请选择短信渠道" clearable>
          <el-option
            v-for="channel in channelOptions"
            :key="channel.id"
            :value="channel.id"
            :label="
              channel.signature + optionLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, channel.code)
            "
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板编号" prop="templateId">
        <el-input
          v-model="queryParams.templateId"
          placeholder="请输入模板编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="发送状态" prop="sendStatus">
        <el-select v-model="queryParams.sendStatus" placeholder="请选择发送状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发送时间" prop="sendTime">
        <el-date-picker
          v-model="queryParams.sendTime"
          style="width: 240px"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item label="接收状态" prop="receiveStatus">
        <el-select v-model="queryParams.receiveStatus" placeholder="请选择接收状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="接收时间" prop="receiveTime">
        <el-date-picker
          v-model="queryParams.receiveTime"
          style="width: 240px"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"
          ><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button
        >
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 操作工具栏 -->
    <el-row class="mb-10px">
      <el-col :span="12">
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button
              type="success"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['system:sms-log:export']"
            >
              <Icon icon="ep:download" class="mr-5px" /> 导出
            </el-button>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="12">
        <right-toolbar v-model:showSearch="showSearch" @query-table="getList" />
      </el-col>
    </el-row>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="smsLoglist">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" align="center" prop="mobile" width="120">
        <template #default="scope">
          <div>{{ scope.row.mobile }}</div>
          <div v-if="scope.row.userType && scope.row.userId">
            <dict-tag :type="DICT_TYPE.USER_TYPE" :value="scope.row.userType" />{{
              '(' + scope.row.userId + ')'
            }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="短信内容" align="center" prop="templateContent" width="300" />
      <el-table-column label="发送状态" align="center" width="180">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS" :value="scope.row.sendStatus" />
          <div>{{ parseTime(scope.row.sendTime) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="接收状态" align="center" width="180">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS" :value="scope.row.receiveStatus" />
          <div>{{ parseTime(scope.row.receiveTime) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="短信渠道" align="center" width="120">
        <template #default="scope">
          <div>{{ formatChannelSignature(scope.row.channelId) }}</div>
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="scope.row.channelCode" />
        </template>
      </el-table-column>
      <el-table-column label="模板编号" align="center" prop="templateId" />
      <el-table-column label="短信类型" align="center" prop="templateType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="scope.row.templateType" />
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        fixed="right"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleView(scope.row)"
            v-hasPermi="['system:sms-log:query']"
            ><Icon icon="ep:view" class="mr-3px" />详情</el-button
          >
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
    <!-- 短信日志详细 -->
    <Dialog title="短信日志详情" v-model="open">
      <el-descriptions border :column="1">
        <el-descriptions-item label-align="right" width="50px" label="日志主键：">
          {{ formData.id }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="短信渠道：">
          {{ formatChannelSignature(formData.channelId) }}
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="formData.channelCode" />
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="短信模板：">
          {{ formData.templateId }} | {{ formData.templateCode }}
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="formData.templateType" />
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="API 的模板编号：">
          {{ formData.apiTemplateId }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="用户信息：">
          {{ formData.mobile }}
          <span v-if="formData.userType && formData.userId">
            <dict-tag :type="DICT_TYPE.USER_TYPE" :value="formData.userType" />
            ({{ formData.userId }})
          </span>
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="短信内容：">
          {{ formData.templateContent }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="短信参数：">
          {{ formData.templateParams }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="创建时间：">
          {{ parseTime(formData.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="发送状态：">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS" :value="formData.sendStatus" />
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="发送时间：">
          {{ parseTime(formData.sendTime) }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="发送结果：">
          {{ formData.sendCode }} | {{ formData.sendMsg }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="API 发送结果：">
          {{ formData.apiSendCode }} | {{ formData.apiSendMsg }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="API 短信编号：">
          {{ formData.apiSerialNo }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="API 请求编号：">
          {{ formData.apiRequestId }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="接收状态：">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS" :value="formData.receiveStatus" />
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="接收时间：">
          {{ parseTime(formData.receiveTime) }}
        </el-descriptions-item>
        <el-descriptions-item label-align="right" width="50px" label="API 接收结果：">
          {{ formData.apiReceiveCode }} | {{ formData.apiReceiveMsg }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="open = false">关 闭</el-button>
      </template>
    </Dialog>
  </content-wrap>
</template>
<script setup lang="ts" name="smsLog">
import { DICT_TYPE, getDictOptions, getDictLabel } from '@/utils/dict'
import download from '@/utils/download'
import { parseTime } from '@/utils/formatTime'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
import * as SmsLogApi from '@/api/system/sms/smsLog'

const message = useMessage() // 消息弹窗

// ================= 表单相关================
const showSearch = ref(true) // 显示搜索条件
const queryForm = ref() // queryFormRef
// 查询参数
const queryParams = ref<SmsLogApi.SmsLogPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  channelId: null,
  templateId: null,
  mobile: '',
  sendStatus: null,
  receiveStatus: null,
  sendTime: [],
  receiveTime: []
})
// 短信渠道列表
const channelOptions = ref<SmsChannelApi.SmsChannelListVO[]>([])
onMounted(() => {
  SmsChannelApi.getSimpleSmsChannels().then((res) => {
    channelOptions.value = res
  })
})
const optionLabel = computed(
  () => (type: string, code: string) => `【${getDictLabel(type, code)}】`
)
/** 格式化短信渠道 */
const formatChannelSignature = (channelId: number | null) => {
  channelOptions.value.forEach((item) => {
    if (item.id === channelId) {
      return item.signature
    }
  })
  return '找不到签名：' + channelId
}
// ================= 表单相关操作================
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}
/** 重置按钮操作 */
const resetQuery = () => {
  resetForm()
  handleQuery()
}
/** 重置搜索表单 */
const resetForm = () => {
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
    channelId: null,
    templateId: null,
    mobile: '',
    sendStatus: null,
    receiveStatus: null,
    sendTime: [],
    receiveTime: []
  }
  queryForm.value?.resetFields()
}
// 导出遮罩层
const exportLoading = ref(false)
/** 导出按钮操作 */
const handleExport = () => {
  // 处理查询参数
  let params = queryParams.value as SmsLogApi.SmsLogExportReqVO
  // 执行导出
  message
    .confirm('是否确认导出所有短信日志数据项?')
    .then(() => {
      exportLoading.value = true
      return SmsLogApi.exportSmsLogApi(params)
    })
    .then((response) => {
      download.excel(response, '短信日志.xls')
      exportLoading.value = false
    })
    .catch(() => {})
}
// ================== 表格 ====================
// 总条数
const total = ref(0)
// 短信日志列表
const smsLoglist = ref([])
const loading = ref(false)
/** 查询列表 */
const getList = () => {
  loading.value = true
  // 执行查询
  SmsLogApi.getSmsLogPageApi(queryParams.value).then((response) => {
    smsLoglist.value = response.list
    total.value = response.total
    loading.value = false
  })
}
// ================== 详情 ====================
const open = ref(false)
const formData = ref<SmsLogApi.SmsLogVO>({
  id: null,
  channelId: null,
  channelCode: '',
  templateId: null,
  templateCode: '',
  templateType: null,
  templateContent: '',
  templateParams: null,
  apiTemplateId: '',
  mobile: '',
  userId: null,
  userType: null,
  sendStatus: null,
  sendTime: null,
  sendCode: null,
  sendMsg: '',
  apiSendCode: '',
  apiSendMsg: '',
  apiRequestId: '',
  apiSerialNo: '',
  receiveStatus: null,
  receiveTime: null,
  apiReceiveCode: '',
  apiReceiveMsg: '',
  createTime: null
})
/** 详细按钮操作 */
const handleView = (row: SmsLogApi.SmsLogVO) => {
  formData.value = row
  open.value = true
}
getList()
</script>
