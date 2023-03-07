<template>
  <ContentWrap>
    <!-- 列表 -->
    <XTable @register="registerTable">
      <template #toolbar_buttons>
        <!-- 操作：新增 -->
        <XButton
          type="primary"
          preIcon="ep:zoom-in"
          :title="t('action.add')"
          v-hasPermi="['system:post:create']"
          @click="openModal('create')"
        />
        <!-- 操作：导出 -->
        <XButton
          type="primary"
          plain
          preIcon="ep:download"
          :title="t('action.export')"
          v-hasPermi="['system:post:export']"
          @click="exportList('岗位列表.xls')"
        />
      </template>
      <template #actionbtns_default="{ row }">
        <!-- 操作：修改 -->
        <XTextButton
          preIcon="ep:edit"
          :title="t('action.edit')"
          v-hasPermi="['system:post:update']"
          @click="openModal('update', row?.id)"
        />
        <!-- 操作：详情 -->
        <XTextButton
          preIcon="ep:view"
          :title="t('action.detail')"
          v-hasPermi="['system:post:query']"
          @click="openModal('detail', row?.id)"
        />
        <!-- 操作：删除 -->
        <XTextButton
          preIcon="ep:delete"
          :title="t('action.delete')"
          v-hasPermi="['system:post:delete']"
          @click="deleteData(row?.id)"
        />
      </template>
    </XTable>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改/详情 -->
  <PostForm ref="modalRef" @success="reload()" />
</template>
<script setup lang="ts" name="Post">
import * as PostApi from '@/api/system/post'
import { allSchemas } from './post.data'
import PostForm from './form.vue'
const { t } = useI18n() // 国际化

// 列表相关的变量
const [registerTable, { reload, deleteData, exportList }] = useXTable({
  allSchemas: allSchemas, // 列表配置
  getListApi: PostApi.getPostPageApi, // 加载列表的 API
  deleteApi: PostApi.deletePostApi, // 删除数据的 API
  exportListApi: PostApi.exportPostApi // 导出数据的 API
})

// 表单相关的变量
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}
</script>
