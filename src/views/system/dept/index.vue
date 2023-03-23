<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="部门名称" prop="title">
        <el-input v-model="queryParams.name" placeholder="请输入部门名称" clearable />
      </el-form-item>
      <el-form-item label="部门状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable>
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
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          @click="openModal('create')"
          v-hasPermi="['system:dept:create']"
          ><Icon icon="ep:plus" class="mr-5px" /> 新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain @click="toggleExpandAll"
          ><Icon icon="ep:sort" class="mr-5px" /> 展开/折叠</el-button
        >
      </el-col>
    </el-row>
    <!-- 列表 -->
    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="deptDatas"
      row-key="id"
      :default-expand-all="isExpandAll"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column prop="name" label="部门名称" width="260" />
      <el-table-column prop="leader" label="负责人" :formatter="userNicknameFormat" width="120" />
      <el-table-column prop="sort" label="排序" width="200" />
      <el-table-column prop="status" label="状态" width="100">
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="el-icon-edit"
            @click="openModal('update', scope.row.id)"
            v-hasPermi="['system:dept:update']"
            >修改</el-button
          >
          <el-button
            v-if="scope.row.parentId !== 0"
            link
            type="danger"
            icon="el-icon-delete"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:dept:delete']"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 添加或修改部门对话框 -->
  <dept-form ref="modalRef" @success="getList" />
</template>
<script setup lang="ts" name="Dept">
import { handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import DeptForm from './form.vue'
import { dateFormatter } from '@/utils/formatTime'
import { getSimpleUserList, UserVO } from '@/api/system/user'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
// 搜索变量
const queryParams = reactive({
  title: '',
  name: undefined,
  status: undefined,
  pageNo: 1,
  pageSize: 100
})

const queryFormRef = ref() // 搜索的表单
const deptDatas = ref() // 数据变量
const userOption = ref<UserVO[]>([])

const isExpandAll = ref(true) // 是否展开，默认全部展开
const refreshTable = ref(true) // 重新渲染表格状态
const loading = ref(true) // 列表的加载中

// 获取用户列表
const getUserList = async () => {
  const res = await getSimpleUserList()
  userOption.value = res
}

/** 展开/折叠操作 */
const toggleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  console.log(isExpandAll.value)
  nextTick(() => {
    refreshTable.value = true
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DeptApi.deleteDeptApi(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 查询部门列表 */
const getList = async () => {
  loading.value = true
  try {
    const res = await DeptApi.getDeptPageApi(queryParams)
    deptDatas.value = handleTree(res)
  } finally {
    loading.value = false
  }
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.pageNo = 1
  queryParams.name = undefined
  queryParams.status = undefined
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const modalRef = ref()
const openModal = (type: string, id?: number) => {
  modalRef.value.openModal(type, id, userOption.value)
}

const userNicknameFormat = (row) => {
  if (!row || !row.leaderUserId) {
    return '未设置'
  }
  for (const user of userOption.value) {
    if (row.leaderUserId === user.id) {
      return user.nickname
    }
  }
  return '未知【' + row.leaderUserId + '】'
}

// ========== 初始化 ==========
onMounted(async () => {
  await getUserList()
  await getList()
})
</script>
