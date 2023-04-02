<template>
  <content-wrap>
    <!-- 搜索工作栏 -->
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="公告标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入公告标题"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="公告状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择公告状态" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="parseInt(dict.value)"
            :label="dict.label"
            :value="parseInt(dict.value)"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          @click="openModal('create')"
          v-hasPermi="['system:notice:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" align="center">
      <el-table-column label="公告编号" align="center" prop="id" />
      <el-table-column label="公告标题" align="center" prop="title" />
      <el-table-column label="公告类型" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTICE_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['system:notice:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:notice:delete']"
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

  <!-- 表单弹窗：添加/修改 -->
  <notice-form ref="modalRef" @success="getList" />
</template>
<script setup lang="tsx">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'
import { DictTag } from '@/components/DictTag'
import NoticeForm from './form.vue'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  title: '',
  type: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 100
})
const queryFormRef = ref() // 搜索的表单

/** 查询公告列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await NoticeApi.getNoticePage(queryParams)

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
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await NoticeApi.deleteNotice(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
