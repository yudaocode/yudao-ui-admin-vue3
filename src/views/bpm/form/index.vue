<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="表单名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入表单名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" @click="openForm()" v-hasPermi="['bpm:form:create']">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </content-wrap>

  <!-- 列表 -->
  <content-wrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="编号" align="center" prop="id" />
      <el-table-column label="表单名" align="center" prop="name" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm(scope.row.id)"
            v-hasPermi="['bpm:form:update']"
          >
            编辑
          </el-button>
          <el-button link @click="openDetail(scope.row.id)" v-hasPermi="['bpm:form:query']">
            详情
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['bpm:form:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </content-wrap>

  <!-- 表单详情的弹窗 -->
  <Dialog title="表单详情" v-model="detailVisible" width="800">
    <form-create :rule="detailData.rule" :option="detailData.option" />
  </Dialog>
</template>

<script setup lang="ts" name="Form">
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const { push } = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await FormApi.getFormPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const openForm = (id?: number) => {
  push({
    name: 'bpmFormEditor',
    query: {
      id
    }
  })
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await FormApi.deleteForm(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 详情操作 */
const detailVisible = ref(false)
const detailData = ref({
  rule: [],
  option: {}
})
const openDetail = async (rowId: number) => {
  // 设置表单
  const data = await FormApi.getForm(rowId)
  setConfAndFields2(detailData, data.conf, data.fields)
  // 弹窗打开
  detailVisible.value = true
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
