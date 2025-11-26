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
      <el-form-item label="公众号" prop="accountId">
        <WxAccountSelect @change="onAccountChanged"/>
      </el-form-item>
      <!--      <el-form-item label="appId" prop="appId">
              <el-input v-model="queryParams.appId" placeholder="请输入appId" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="公众号模板ID" prop="templateId">
              <el-input v-model="queryParams.templateId" placeholder="请输入公众号模板ID" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="模版名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入模版名称" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <el-form-item label="标题" prop="title">
        <el-input
            v-model="queryParams.title"
            placeholder="请输入标题"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
        />
      </el-form-item>
      <!--      <el-form-item label="消息内容" prop="data">
              <el-input v-model="queryParams.data" placeholder="请输入消息内容" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="链接" prop="url">
              <el-input v-model="queryParams.url" placeholder="请输入链接" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="小程序appId" prop="miniProgramAppId">
              <el-input v-model="queryParams.miniProgramAppId" placeholder="请输入小程序appId" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="小程序页面路径" prop="miniProgramPagePath">
              <el-input v-model="queryParams.miniProgramPagePath" placeholder="请输入小程序页面路径" clearable @keyup.enter="handleQuery" class="!w-240px"/>
            </el-form-item>-->
      <!--      <el-form-item label="是否有效" prop="status">
              <el-select v-model="queryParams.status" placeholder="请选择是否有效" clearable class="!w-240px">
                <el-option label="请选择字典生成" value="" />
              </el-select>
            </el-form-item>-->
      <!--      <el-form-item label="公众号是否已移除" prop="isRemoved">
              <el-input v-model="queryParams.isRemoved" placeholder="请输入公众号是否已移除" clearable @keyup.enter="handleQuery" class="!w-240px"/>
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
        <!--        <el-button type="primary" plain @click="openForm('create')" v-hasPermi="['mp:template:create']">
                  <Icon icon="ep:plus" class="mr-5px" /> 新增
                </el-button>-->
        <el-button type="warning" plain @click="handleSync" :loading="syncLoading" v-hasPermi="['mp:template:sync']">
          <Icon icon="ep:refresh" class="mr-5px"/>
          同步模板
        </el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading"
                   v-hasPermi="['mp:template:export']">
          <Icon icon="ep:download" class="mr-5px"/>
          导出
        </el-button>
        <el-button :disabled="multipleSelection.length !== 1" type="success" plain @click="sendMessage()"
                   v-hasPermi="['mp:template:send']">
          <el-icon>
            <Promotion/>
          </el-icon>
          推送消息
        </el-button>
        <el-button :disabled="multipleSelection.length === 0" type="danger" plain @click="batchDelete()"
                   v-hasPermi="['mp:template:delete']">
          <el-icon>
            <DeleteFilled/>
          </el-icon>
          批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleSelectionChange"
    >
      <!--      <el-table-column label="主键" align="center" prop="id" />-->
      <el-table-column type="selection" width="55"/>
      <el-table-column label="appId" align="center" prop="appId"/>
      <el-table-column label="公众号模板ID" align="center" prop="templateId"/>
      <el-table-column label="模版名称" align="center" prop="name"/>
      <el-table-column label="标题" align="center" prop="title"/>
      <el-table-column label="模板内容" align="center" prop="content"/>
      <el-table-column label="消息内容" align="center" prop="data"/>
      <el-table-column label="链接" align="center" prop="url"/>
      <el-table-column label="小程序appId" align="center" prop="miniProgramAppId"/>
      <el-table-column label="小程序页面路径" align="center" prop="miniProgramPagePath"/>
      <el-table-column label="是否有效" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.IS_VALID" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="公众号是否已移除" align="center" prop="isRemoved">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.IS_DELETE" :value="scope.row.isRemoved"/>
        </template>
      </el-table-column>
      <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['mp:template:update']"
          >
            配置
          </el-button>
          <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mp:template:delete']"
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
  <MsgTemplateForm ref="formRef" @success="getList"/>
  <MsgTemplateSend ref="sendRef" @success="getList"/>
</template>

<script setup lang="ts">
import {DICT_TYPE} from '@/utils/dict'
import {dateFormatter} from '@/utils/formatTime'
import download from '@/utils/download'
import {MsgTemplateApi, MsgTemplateVO} from '@/api/mp/template'
import MsgTemplateForm from './MsgTemplateForm.vue'
import MsgTemplateSend from './MsgTemplateSend.vue'
import WxAccountSelect from '@/views/mp/components/wx-account-select'
import {DeleteFilled, Promotion} from '@element-plus/icons-vue'

/** 消息模板 列表 */
defineOptions({name: 'MsgTemplate'})

const message = useMessage() // 消息弹窗
const {t} = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MsgTemplateVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const multipleSelection = ref<MsgTemplateVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: -1,
  appId: undefined,
  templateId: undefined,
  name: undefined,
  title: undefined,
  content: undefined,
  data: undefined,
  url: undefined,
  miniProgramAppId: undefined,
  miniProgramPagePath: undefined,
  status: undefined,
  isRemoved: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中
const syncLoading = ref(false) // 同步模板的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MsgTemplateApi.getMsgTemplatePage(queryParams)
    if (data) {
      list.value = data.list
      total.value = data.total
    }
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const handleSelectionChange = (val: MsgTemplateVO[]) => {
  multipleSelection.value = val
}

/** 重置按钮操作 */
const resetQuery = async () => {
  // 暂存 accountId，并在 reset 后恢复
  const accountId = queryParams.accountId
  queryFormRef.value?.resetFields()
  queryParams.accountId = accountId
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
/** 添加/修改操作 */
const sendRef = ref()
const sendMessage = () => {
  let templateId = multipleSelection.value[0].templateId;
  let data = multipleSelection.value[0].data;
  if (!templateId) {
    message.warning('消息模板无效')
    return
  }
  if (!data || data.length === 0) {
    message.warning('消息模板数据无效')
    return
  }
  sendRef.value.open(queryParams.accountId, multipleSelection.value[0].appId, templateId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MsgTemplateApi.deleteMsgTemplate(id)
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
    const data = await MsgTemplateApi.exportMsgTemplate(queryParams)
    download.excel(data, '消息模板.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 同步公众号模板 */
const handleSync = async () => {
  try {
    // 同步的二次确认
    await message.confirm('确认要同步公众号模板吗？', '提示')
    // 发起同步
    syncLoading.value = true
    await MsgTemplateApi.syncMsgTemplate(queryParams)
    message.success('同步成功')
    // 刷新列表
    await getList()
  } catch {
  } finally {
    syncLoading.value = false
  }
}

/** 公众号选择变化 */
const onAccountChanged = (accountId: number) => {
  queryParams.accountId = accountId
  queryParams.pageNo = 1
  handleQuery()
}

const batchDelete = async () => {
  let ids = multipleSelection.value.map((item) => item.id);
  await message.confirm('确认要删除所选的公众号模板吗？', '提示')
  await MsgTemplateApi.deleteList(ids)
  message.success('删除成功')
}

/** 初始化 **/
onMounted(() => {
  // getList()
})
</script>
