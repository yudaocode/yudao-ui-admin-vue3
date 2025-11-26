<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="100px">
      <!--      <el-form-item label="appId" prop="appId">
              <el-input v-model="queryParams.appId" placeholder="请输入appId" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <el-form-item label="用户openid" prop="toUser">
        <el-input v-model="queryParams.toUser" placeholder="请输入用户openid" clearable @keyup.enter="handleQuery"
                  class="!w-240px"/>
      </el-form-item>
      <!--      <el-form-item label="公众号模板ID" prop="templateId">
              <el-input v-model="queryParams.templateId" placeholder="请输入公众号模板ID" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="消息内容" prop="data">
              <el-input v-model="queryParams.data" placeholder="请输入消息内容" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="链接" prop="url">
              <el-input v-model="queryParams.url" placeholder="请输入链接" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="小程序appid" prop="miniProgramAppId">
              <el-input v-model="queryParams.miniProgramAppId" placeholder="请输入小程序appid" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="小程序页面路径" prop="miniProgramPagePath">
              <el-input v-model="queryParams.miniProgramPagePath" placeholder="请输入小程序页面路径" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="发送时间" prop="sendTime">
              <el-date-picker
                v-model="queryParams.sendTime"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
                class="!w-220px"
              />
            </el-form-item>-->
      <!--      <el-form-item label="发送状态 0成功，1失败" prop="sendStatus">
              <el-select v-model="queryParams.sendStatus" placeholder="请选择发送状态 0成功，1失败" clearable class="!w-240px">
                <el-option label="请选择字典生成" value="" />
              </el-select>
            </el-form-item>-->
      <!--      <el-form-item label="发送结果" prop="sendResult">
              <el-input v-model="queryParams.sendResult" placeholder="请输入发送结果" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="创建时间" prop="createTime">
              <el-date-picker
                v-model="queryParams.createTime"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="daterange"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
                class="!w-220px"
              />
            </el-form-item>-->
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px"/>
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px"/>
          重置
        </el-button>
        <!--        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['mp:template-log:create']">
                  <Icon icon="ep:plus" class="mr-5px" /> 新增
                </el-button>-->
        <el-button type="success" plain @click="handleExport" :loading="exportLoading"
                   v-hasPermi="['mp:template-log:export']">
          <Icon icon="ep:download" class="mr-5px"/>
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <!--      <el-table-column label="主键" align="center" prop="id" />-->
      <el-table-column label="appId" align="center" prop="appId"/>
      <el-table-column label="用户openid" align="center" prop="toUser"/>
      <el-table-column label="公众号模板ID" align="center" prop="templateId"/>
      <el-table-column label="消息内容" align="center" prop="data"/>
      <el-table-column label="链接" align="center" prop="url"/>
      <el-table-column label="小程序appid" align="center" prop="miniProgramAppId"/>
      <el-table-column label="小程序页面路径" align="center" prop="miniProgramPagePath"/>
      <el-table-column label="发送时间" align="center" prop="sendTime" :formatter="dateFormatter" width="180px"/>
      <el-table-column label="发送状态" align="center" prop="sendStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SEND_STATUS" :value="scope.row.sendStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="发送结果" align="center" prop="sendResult"/>
      <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180px"/>
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <!--          <el-button link type="primary" @click="openForm('update', scope.row.id)" v-hasPermi="['mp:template-log:update']">
                      编辑
                    </el-button>-->
          <el-button link type="danger" @click="handleDelete(scope.row.id)" v-hasPermi="['mp:template-log:delete']">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
                @pagination="getList"/>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <MsgTemplateLogForm ref="formRef" @success="getList"/>
</template>

<script setup lang="ts">
import {DICT_TYPE} from '@/utils/dict'
import {dateFormatter} from '@/utils/formatTime'
import download from '@/utils/download'
import {MsgTemplateLogApi, MsgTemplateLogVO} from '@/api/mp/template'
import MsgTemplateLogForm from './MsgTemplateLogForm.vue'

/** 微信模版消息发送记录 列表 */
defineOptions({name: 'MsgTemplateLog'})

const message = useMessage() // 消息弹窗
const {t} = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MsgTemplateLogVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  appId: undefined,
  toUser: undefined,
  templateId: undefined,
  data: undefined,
  url: undefined,
  miniProgramAppId: undefined,
  miniProgramPagePath: undefined,
  sendTime: [],
  sendStatus: undefined,
  sendResult: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MsgTemplateLogApi.getMsgTemplateLogPage(queryParams)
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
    await MsgTemplateLogApi.deleteMsgTemplateLog(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {
  }
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await MsgTemplateLogApi.exportMsgTemplateLog(queryParams)
    download.excel(data, '微信模版消息发送记录.xls')
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
