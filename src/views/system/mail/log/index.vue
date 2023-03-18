<template>
  <!-- 搜索工作栏 -->
  <content-wrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams" />
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <Table
      :columns="allSchemas.tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{
        total: tableObject.total
      }"
      v-model:pageSize="tableObject.pageSize"
      v-model:currentPage="tableObject.currentPage"
    >
      <template #action="{ row }">
        <el-button
          link
          type="primary"
          @click="openModal('update', row.id)"
          v-hasPermi="['system:mail-log:query']"
        >
          详情
        </el-button>
      </template>
    </Table>
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <!--  <mail-account-form ref="modalRef" @success="getList" />-->
</template>
<script setup lang="ts" name="MailLog">
import { allSchemas } from './log.data'
import * as MailLogApi from '@/api/system/mail/log'
// import MailAccountForm from './form.vue'

// tableObject：表格的属性对象，可获得分页大小、条数等属性
// tableMethods：表格的操作对象，可进行获得分页、删除记录等操作
// 详细可见：https://kailong110120130.gitee.io/vue-element-plus-admin-doc/components/table.html#usetable
const { tableObject, tableMethods } = useTable({
  getListApi: MailLogApi.getMailLogPageApi // 分页接口
})
// 获得表格的各种操作
const { getList, setSearchParams } = tableMethods

/** 添加/修改操作 */
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
