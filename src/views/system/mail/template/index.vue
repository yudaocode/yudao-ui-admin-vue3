<template>
  <doc-alert title="邮件配置" url="https://doc.iocoder.cn/mail" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams">
      <!-- 新增等操作按钮 -->
      <template #actionMore>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:mail-template:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="danger"
          plain
          @click="handleDeleteBatch"
          :disabled="!isSelected"
          v-hasPermi="['system:mail-template:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> 批量删除
        </el-button>
      </template>
    </Search>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <Table
      :columns="allSchemas.tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{
        total: tableObject.total
      }"
      v-model:pageSize="tableObject.pageSize"
      v-model:currentPage="tableObject.currentPage"
      :selection="true"
    >
      <template #action="{ row }">
        <el-button
          link
          type="primary"
          @click="openSendForm(row.id)"
          v-hasPermi="['system:mail-template:send-mail']"
        >
          测试
        </el-button>
        <el-button
          link
          type="primary"
          @click="openForm('update', row.id)"
          v-hasPermi="['system:mail-template:update']"
        >
          编辑
        </el-button>
        <el-button
          link
          type="danger"
          v-hasPermi="['system:mail-template:delete']"
          @click="handleDelete(row.id)"
        >
          删除
        </el-button>
      </template>
    </Table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <MailTemplateForm ref="formRef" @success="getList" />

  <!-- 表单弹窗：发送测试 -->
  <MailTemplateSendForm ref="sendFormRef" />
</template>
<script lang="ts" setup>
import { allSchemas } from './template.data'
import * as MailTemplateApi from '@/api/system/mail/template'
import MailTemplateForm from './MailTemplateForm.vue'
import MailTemplateSendForm from './MailTemplateSendForm.vue'

defineOptions({ name: 'SystemMailTemplate' })

// tableObject：表格的属性对象，可获得分页大小、条数等属性
// tableMethods：表格的操作对象，可进行获得分页、删除记录等操作
// 详细可见：https://doc.iocoder.cn/vue3/crud-schema/
const { tableObject, tableMethods } = useTable({
  getListApi: MailTemplateApi.getMailTemplatePage, // 分页接口
  delListApi: MailTemplateApi.deleteMailTemplate // 删除接口
})
// 获得表格的各种操作
const { getList, setSearchParams } = tableMethods

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = (id: number) => {
  tableMethods.delList(id, false)
}

/** 是否有选中行 */
const isSelected = computed(() => {
  return tableObject.selections && tableObject.selections.length > 0
})

/** 批量删除按钮操作 */
const handleDeleteBatch = async () => {
  const ids = tableObject.selections.map(item => item.id)
  if (ids.length === 0) return
  await MailTemplateApi.deleteMailTemplateList(ids)
  tableMethods.getList()
}

/** 发送测试操作 */
const sendFormRef = ref()
const openSendForm = (id: number) => {
  sendFormRef.value.open(id)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
