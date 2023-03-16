<template>
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
  </ContentWrap>

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
        <ElButton type="danger" @click="delData(row, false)">
          {{ t('exampleDemo.del') }}
        </ElButton>
      </template>
    </Table>
  </ContentWrap>
</template>
<script setup lang="ts" name="MailAccount">
import { allSchemas } from './account.data'
import { useTable } from '@/hooks/web/useTable'
import { Table } from '@/components/Table'
import * as MailAccountApi from '@/api/system/mail/account'

const { register, tableObject, methods } = useTable<MailAccountApi.MailAccountVO>({
  getListApi: MailAccountApi.getMailAccountPageApi,
  delListApi: MailAccountApi.deleteMailAccountApi
})

const { getList, setSearchParams } = methods

getList()
</script>
