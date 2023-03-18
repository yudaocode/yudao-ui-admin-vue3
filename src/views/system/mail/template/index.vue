<template>
  <!-- 搜索工作栏 -->
  <content-wrap>
    <Search :schema="allSchemas.searchSchema" @search="setSearchParams" @reset="setSearchParams">
      <!-- 新增等操作按钮 -->
      <template #actionMore>
        <el-button
          type="primary"
          @click="openModal('create')"
          v-hasPermi="['system:mail-account:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </template>
    </Search>
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
  </content-wrap>

  <!-- 表单弹窗：添加/修改 -->
  <mail-template-form ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="MailTemplate">
import { allSchemas } from './template.data'
import * as MailTemplateApi from '@/api/system/mail/template'
import MailTemplateForm from './form.vue'

// tableObject：表格的属性对象，可获得分页大小、条数等属性
// tableMethods：表格的操作对象，可进行获得分页、删除记录等操作
// 详细可见：https://kailong110120130.gitee.io/vue-element-plus-admin-doc/components/table.html#usetable
const { tableObject, tableMethods } = useTable({
  getListApi: MailTemplateApi.getMailTemplatePage, // 分页接口
  delListApi: MailTemplateApi.deleteMailTemplate // 删除接口
})
// 获得表格的各种操作
const { getList, setSearchParams } = tableMethods

/** 添加/修改操作 */
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 删除按钮操作 */
const handleDelete = (id: number) => {
  tableMethods.delList(id, false)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
