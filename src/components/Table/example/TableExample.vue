<script setup lang="ts">
/**
 * 公共 Table 组件的使用示例（固定数据，不调用接口，不注册菜单 / 路由）
 *
 * 1. useCrudSchemas 生成列：配置 dictType 后自动使用 DictTag 渲染字典（依赖系统字典缓存）
 * 2. 直接写 columns：通过 column.slots.default 自定义单元格
 * 3. showAction 工具栏：刷新、尺寸、列设置（显隐 / 固定 / 排序）
 * 4. v-model:currentPage / v-model:pageSize 分页
 */
import { computed, h, reactive, ref } from 'vue'
import { ElButton, ElMessage } from 'element-plus'
import { Table } from '@/components/Table'
import type { TableColumn, TableExpose, TableSlotDefault } from '@/components/Table'
import { useCrudSchemas, CrudSchema } from '@/hooks/web/useCrudSchemas'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'TableExample' })

// 固定的示例数据，status 为数字 0 / 1，对应 COMMON_STATUS 字典
const rows = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `示例用户 ${index + 1}`,
  status: index % 3 === 0 ? 1 : 0,
  createTime: `2026-11-${String((index % 28) + 1).padStart(2, '0')}`
}))

// 1. useCrudSchemas：只演示表格列，不生成表单 / 详情
const crudSchemas = reactive<CrudSchema[]>([
  { field: 'id', label: '编号', isForm: false, isDetail: false },
  { field: 'name', label: '名称', isForm: false, isDetail: false },
  {
    field: 'status',
    label: '状态',
    dictType: DICT_TYPE.COMMON_STATUS,
    dictClass: 'number',
    isForm: false,
    isDetail: false
  },
  { field: 'createTime', label: '创建时间', isForm: false, isDetail: false }
])
const { allSchemas } = useCrudSchemas(crudSchemas)

// 2. 直接写 columns，并用 column.slots.default 自定义操作列
// 注意：columns 必须是可变数组，Table 的 addColumn / delColumn / setColumn 会直接修改它
const columns = reactive<TableColumn[]>([
  { field: 'index', type: 'index', label: '序号' },
  ...allSchemas.tableColumns,
  {
    field: 'action',
    label: '操作',
    width: 120,
    slots: {
      default: ({ row }: TableSlotDefault) =>
        h(
          ElButton,
          { link: true, type: 'primary', onClick: () => ElMessage.info(`查看：${row.name}`) },
          () => '查看'
        )
    }
  }
])

// 3. / 4. 分页
const currentPage = ref(1)
const pageSize = ref(10)
const pageData = computed(() =>
  rows.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
)

// 演示 Table 暴露的 addColumn / delColumn
const tableRef = ref<TableExpose>()
const hasRemark = ref(false)
const toggleRemark = () => {
  if (hasRemark.value) {
    tableRef.value?.delColumn('remark')
  } else {
    tableRef.value?.addColumn(
      {
        field: 'remark',
        label: '备注',
        formatter: (row: Recordable) => (row.status === 1 ? '已停用' : '')
      },
      2
    )
  }
  hasRemark.value = !hasRemark.value
}

const onRefresh = () => ElMessage.success('刷新（示例为固定数据）')
</script>

<template>
  <div>
    <ElButton class="mb-10px" @click="toggleRemark">
      {{ hasRemark ? '删除备注列' : '添加备注列' }}
    </ElButton>
    <Table
      ref="tableRef"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :columns="columns"
      :data="pageData"
      :pagination="{ total: rows.length }"
      show-action
      row-key="id"
      @refresh="onRefresh"
    />
  </div>
</template>
