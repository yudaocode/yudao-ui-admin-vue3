<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form
      :model="queryParams"
      ref="queryForm"
      :inline="true"
      v-show="showSearch"
      label-width="150px"
    >
      <el-form-item label="短信类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择短信类型" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择开启状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模板编码" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入模板编码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="短信 API 的模板编号" prop="apiTemplateId">
        <el-input
          v-model="queryParams.apiTemplateId"
          placeholder="请输入短信 API 的模板编号"
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
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
    <!-- 操作工具栏 -->
    <el-row>
      <el-col :span="12">
        <el-row :gutter="10">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              @click="handleAdd('template.addTitle')"
              v-hasPermi="['system:sms-template:create']"
              ><Icon icon="ep:plus" class="mr-5px" />新增</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="success"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['system:sms-template:export']"
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
    <el-table v-loading="loading" :data="templateList" align="center">
      <el-table-column
        label="模板编码"
        align="center"
        prop="code"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="模板名称"
        align="center"
        prop="name"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="模板内容"
        align="center"
        prop="content"
        width="200"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="短信类型" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="短信 API 的模板编号"
        align="center"
        prop="apiTemplateId"
        width="200"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="短信渠道" align="center" width="120">
        <template #default="scope">
          <div>{{ formatChannelSignature(scope.row.channelId) }}</div>
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="scope.row.channelCode" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
        width="210"
        fixed="right"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleSendSms('template.sendSms', scope.row)"
            v-hasPermi="['system:sms-template:send-sms']"
            ><Icon icon="ep:share" class="mr-3px" />测试</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleUpdate('template.updtaeTitle', scope.row)"
            v-hasPermi="['system:sms-template:update']"
            ><Icon icon="ep:edit" class="mr-3px" />修改</el-button
          >
          <el-button
            link
            type="primary"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:sms-template:delete']"
            ><Icon icon="ep:delete" class="mr-3px" />删除</el-button
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
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <SmsTemplateFrom ref="modalRef" :channelOptions="channelOptions" @success="getList" />
</template>
<script setup lang="ts" name="SmsTemplate">
import { DICT_TYPE, getDictOptions, getDictLabel } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as templateApi from '@/api/system/sms/smsTemplate'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
import download from '@/utils/download'
import SmsTemplateFrom from './form.vue'
const message = useMessage() // 消息弹窗
// const { t } = useI18n() // 国际化

// 弹出层ref
const modalRef = ref()
// 遮罩层
const loading = ref(true)
// 导出遮罩层
// const exportLoading = ref(false)
// 显示搜索条件
const showSearch = ref(true)
// 表单ref
const queryForm = ref()
// 查询参数
const queryParams = ref<templateApi.SmsTemplatePageReqVO>({
  pageNo: 1,
  pageSize: 10,
  type: null,
  status: null,
  code: '',
  content: '',
  apiTemplateId: '',
  channelId: null,
  createTime: []
})
// 总条数
const total = ref(0)
// 短信模板列表
const templateList = ref([])
/** 查询列表 */
const getList = () => {
  loading.value = true
  // 执行查询
  templateApi.getSmsTemplatePageApi(queryParams.value).then((response) => {
    templateList.value = response.list
    total.value = response.total
    loading.value = false
  })
}
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
    type: null,
    status: null,
    code: '',
    content: '',
    apiTemplateId: '',
    channelId: null,
    createTime: []
  }
  queryForm.value?.resetFields()
}
// 短信渠道
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
const formatChannelSignature = (channelId: number) => {
  channelOptions.value.forEach((item) => {
    if (item.id === channelId) {
      return item.signature
    }
  })
  return '找不到签名：' + channelId
}
/** 新增按钮操作 */
const handleAdd = (type: string) => {
  modalRef.value.openModal({ type })
}
/** 修改按钮操作 */
// const handleUpdate = (row) => {}
const exportLoading = ref(false)
/** 导出按钮操作 */
const handleExport = () => {
  // 处理查询参数
  let params = { ...queryParams.value } as templateApi.SmsTemplateExportReqVO
  // 执行导出
  message
    .confirm('是否确认导出所有短信模板数据项?', '警告')
    .then(() => {
      exportLoading.value = true
      return templateApi.exportPostApi(params)
    })
    .then((response) => {
      download.excel(response, '短信模板.xls')
      exportLoading.value = false
    })
    .catch(() => {})
}
/** 发送短信按钮 */
const handleSendSms = (type, row: any) => {
  modalRef.value.openModal({ type, row })
}
const handleUpdate = (type: string, { id }: { id: number }) => {
  modalRef.value.openModal({ type, id })
}
/** 删除按钮操作 */
const handleDelete = ({ id }: { id: number }) => {
  message
    .confirm('是否确认删除短信模板编号为"' + id + '"的数据项?')
    .then(function () {
      return templateApi.deleteSmsTemplateApi(id)
    })
    .then(() => {
      getList()
      message.success('删除成功')
    })
    .catch(() => {})
}

getList()
</script>
