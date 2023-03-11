<template>
  <ContentWrap>
    <el-form ref="searchForm" :model="queryParms" :inline="true">
      <el-form-item label="公告标题">
        <el-input v-model="queryParms.title" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParms.status">
          <el-option label="全部" value="" />
          <el-option label="开启" :value="1" />
          <el-option label="关闭" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">Query</el-button>
      </el-form-item>
    </el-form>
    <div style="width: 100%; height: 600px">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            :columns="columns"
            :data="tableData"
            :width="width"
            :height="height - 50"
            fixed
          />
        </template>
      </el-auto-resizer>
    </div>
    <div class="mt-2">
      <el-pagination
        :current-page="queryParms.pageNo"
        :page-size="queryParms.pageSize"
        :page-sizes="[10, 20, 30, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="tableTotal"
        @size-change="getList"
        @current-change="getList"
      />
    </div>
  </ContentWrap>
</template>
<script setup lang="tsx">
import dayjs from 'dayjs'
import { Column, ElPagination, ElTableV2, TableV2FixedDir } from 'element-plus'
import * as NoticeApi from '@/api/system/notice'
import { XTextButton } from '@/components/XButton'
import { DictTag } from '@/components/DictTag'
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
    width: 180,
    cellRenderer: ({ cellData: type }) => (
      <DictTag type={DICT_TYPE.SYSTEM_NOTICE_TYPE} value={type}></DictTag>
    )
  },
  {
    key: 'status',
    dataKey: 'status',
    title: t('common.status'),
    width: 180,
    cellRenderer: ({ cellData: status }) => (
      <DictTag type={DICT_TYPE.COMMON_STATUS} value={status}></DictTag>
    )
  },
  {
    key: 'content',
    dataKey: 'content',
    title: '公告内容',
    width: 400,
    cellRenderer: ({ cellData: content }) => <span v-html={content}></span>
  },
  {
    key: 'createTime',
    dataKey: 'createTime',
    title: t('common.createTime'),
    width: 180,
    cellRenderer: ({ cellData: createTime }) => (
      <>{dayjs(createTime).format('YYYY-MM-DD HH:mm:ss')}</>
    )
  },
  {
    key: 'actionbtns',
    dataKey: 'actionbtns', //需要渲染当前列的数据字段，如{id:9527,name:'Mike'}，则填id
    title: '操作', //显示在单元格表头的文本
    width: 160, //当前列的宽度，必须设置
    fixed: TableV2FixedDir.RIGHT, //是否固定列
    align: 'center',
    cellRenderer: ({ cellData: id }) => (
      <>
        <XTextButton
          preIcon="ep:delete"
          title={t('action.edit')}
          onClick={handleUpdate.bind(this, id)}
        ></XTextButton>
        <XTextButton
          preIcon="ep:delete"
          title={t('action.del')}
          onClick={handleDelete.bind(this, id)}
        ></XTextButton>
      </>
    )
  }
]

const tableData = ref([])

const tableTotal = ref(0)

const queryParms = reactive({
  title: '',
  status: undefined,
  pageNo: 1,
  pageSize: 100
})

const getList = async () => {
  const res = await NoticeApi.getNoticePageApi(queryParms)
  tableData.value = res.list
  tableTotal.value = res.total
}

const handleUpdate = (id) => {
  console.info(id)
}

const handleDelete = (id) => {
  console.info(id)
}

getList()
</script>
