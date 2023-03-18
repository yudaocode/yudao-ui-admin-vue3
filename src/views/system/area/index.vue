<template>
  <ContentWrap>
    <div style="width: 100%; height: 500px">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            :columns="columns"
            :data="tableData"
            :width="width"
            :height="height"
            fixed
            expand-column-key="id"
          />
        </template>
      </el-auto-resizer>
    </div>
  </ContentWrap>
</template>
<script setup lang="tsx">
import { Column, ElTableV2 } from 'element-plus'
import * as AreaApi from '@/api/system/area'

const columns: Column[] = [
  {
    key: 'id',
    dataKey: 'id', // 需要渲染当前列的数据字段，如{id:9527,name:'Mike'}，则填id
    title: '编号', // 显示在单元格表头的文本
    width: 200, // 当前列的宽度，必须设置
    fixed: true // 是否固定列
  },
  {
    key: 'name',
    dataKey: 'name',
    title: '地名',
    width: 200
  }
]

const tableData = ref([])

const getList = async () => {
  tableData.value = await AreaApi.getAreaTree()
}

getList()
</script>
