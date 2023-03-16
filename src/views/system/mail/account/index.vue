<template>
  <ContentWrap>
    <!-- TODO @芋艿：setSearchParams -->
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
  </ContentWrap>

  <el-button
    type="primary"
    @click="openModal('create')"
    v-hasPermi="['system:mail-account:create']"
  >
    <Icon icon="ep:plus" class="mr-5px" /> 新增
  </el-button>

  <ContentWrap>
    <Table
      v-model:pageSize="tableObject.pageSize"
      v-model:currentPage="tableObject.currentPage"
      :columns="allSchemas.tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{
        total: tableObject.total
      }"
      @register="register"
    >
      <template #action="{ row }">
        <el-button
          link
          type="primary"
          @click="openModal('update', row.id)"
          v-hasPermi="['system:mail-account:update']"
        >
          编辑
        </el-button>
        <el-button
          link
          type="danger"
          v-hasPermi="['system:mail-account:delete']"
          @click="delList(row.id, false)"
        >
          删除
        </el-button>
      </template>
    </Table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <mail-account-form ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="MailAccount">
import { allSchemas } from './account.data'
import { useTable } from '@/hooks/web/useTable'
import * as MailAccountApi from '@/api/system/mail/account'
import MailAccountForm from './form.vue'

// const { t } = useI18n() // 国际化
// const message = useMessage() // 消息弹窗

const { register, tableObject, methods } = useTable<MailAccountApi.MailAccountVO>({
  getListApi: MailAccountApi.getMailAccountPageApi,
  delListApi: MailAccountApi.deleteMailAccountApi
})

const { getList, setSearchParams } = methods

const { delList } = methods

/** 添加/修改操作 */
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

getList()
</script>
