<template>
  <doc-alert title="模版消息" url="https://doc.iocoder.cn/mp/message-template/" />

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
        <WxAccountSelect @change="onAccountChanged" />
      </el-form-item>
      <el-form-item>
        <el-button
          type="success"
          plain
          @click="handleSync"
          :loading="syncLoading"
          v-hasPermi="['mp:message-template:sync']"
          :disabled="queryParams.accountId === -1"
        >
          <Icon icon="ep:refresh" class="mr-5px" /> 同步
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="公众号模板 ID" align="center" prop="templateId" width="200px" />
      <el-table-column label="标题" align="center" prop="title" width="150px" />
      <el-table-column label="模板内容" align="center" prop="content" />
      <el-table-column label="模板示例" align="center" prop="example" width="200px" />
      <el-table-column label="一级行业" align="center" prop="primaryIndustry" width="120px" />
      <el-table-column label="二级行业" align="center" prop="deputyIndustry" width="120px" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="160">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleSend(scope.row)"
            v-hasPermi="['mp:message-template:send']"
          >
            发送
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mp:message-template:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：发送消息 -->
  <MessageTemplateSendForm ref="sendFormRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { MessageTemplateApi, MsgTemplateVO } from '@/api/mp/messageTemplate'
import MessageTemplateSendForm from './MessageTemplateSendForm.vue'
import WxAccountSelect from '@/views/mp/components/wx-account-select'

/** 公众号消息模板列表 */
defineOptions({ name: 'MpMessageTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MsgTemplateVO[]>([]) // 列表的数据
const queryParams = reactive({
  accountId: -1
})
const queryFormRef = ref() // 搜索的表单
const syncLoading = ref(false) // 同步模板的加载中

/** 公众号选择变化 */
const onAccountChanged = (accountId: number) => {
  queryParams.accountId = accountId
  getList()
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MessageTemplateApi.getMessageTemplateList(queryParams)
    if (data) {
      list.value = data
    }
  } finally {
    loading.value = false
  }
}

/** 同步操作 */
const handleSync = async () => {
  try {
    await message.confirm('是否确认同步消息模板？')
    syncLoading.value = true
    await MessageTemplateApi.syncMessageTemplate(queryParams.accountId)
    message.success('同步消息模板成功')
    await getList()
  } finally {
    syncLoading.value = false
  }
}

/** 发送消息操作 */
const sendFormRef = ref()
const handleSend = (row: MsgTemplateVO) => {
  sendFormRef.value.open(row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MessageTemplateApi.deleteMessageTemplate(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}
</script>
