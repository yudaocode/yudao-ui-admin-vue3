<template>
  <ContentWrap>
    <div style="width: 100%; height: 500px">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2 :columns="columns" :data="tableData" :width="width" :height="height" fixed />
        </template>
      </el-auto-resizer>
      <el-pagination
        :current-page="queryParms.pageNo"
        :page-size="queryParms.pageSize"
        layout="total, prev, pager, next"
        :total="tableTotal"
        @size-change="getList"
        @current-change="getList"
      />
    </div>
  </ContentWrap>
</template>
<script setup lang="ts">
import { Column, TableV2FixedDir } from 'element-plus'
import * as NoticeApi from '@/api/system/notice'
import { XTextButton } from '@/components/XButton'
const { t } = useI18n() // 国际化

const columns: Column<any>[] = [
  {
    key: 'id',
    dataKey: 'id', //需要渲染当前列的数据字段，如{id:9527,name:'Mike'}，则填id
    title: 'id', //显示在单元格表头的文本
    width: 80, //当前列的宽度，必须设置
    fixed: true //是否固定列
  },
  {
    key: 'title',
    dataKey: 'title',
    title: '公告标题',
    width: 180
  },
  {
    key: 'type',
    dataKey: 'type',
    title: '公告类型',
    width: 180
  },
  {
    key: 'status',
    dataKey: 'status',
    title: t('common.status'),
    width: 180
  },
  {
    key: 'content',
    dataKey: 'content',
    title: '公告内容',
    width: 180
  },
  {
    key: 'createTime',
    dataKey: 'createTime',
    title: t('common.createTime'),
    width: 180
  },
  {
    key: 'actionbtns',
    dataKey: 'actionbtns', //需要渲染当前列的数据字段，如{id:9527,name:'Mike'}，则填id
    title: '操作', //显示在单元格表头的文本
    width: 80, //当前列的宽度，必须设置
    fixed: TableV2FixedDir.RIGHT, //是否固定列
    align: 'center',
    cellRenderer: (date) =>
      h(XTextButton, {
        onClick: () => handleDelete(date.rowData),
        type: 'danger',
        preIcon: 'ep:delete',
        title: t('action.del')
      })
  }
]

const tableData = ref([])

const tableTotal = ref(0)

const queryParms = reactive({
  title: '',
  status: undefined,
  pageNo: 1,
  pageSize: 10
})

const getList = async () => {
  const res = await NoticeApi.getNoticePageApi(queryParms)
  tableData.value = res.list
  tableTotal.value = res.total
}

const handleDelete = (row) => {
  console.info(row.id)
}

getList()
</script>
