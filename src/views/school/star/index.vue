<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="学生名称" prop="stuName">
        <el-input
          v-model="queryParams.stuName"
          class="!w-240px"
          clearable
          placeholder="请输入学生名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="六星名称" prop="type">
        <el-input
          v-model="queryParams.type"
          class="!w-240px"
          clearable
          placeholder="请输入六星名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-input
          v-model="queryParams.grade"
          class="!w-240px"
          clearable
          placeholder="请输入年级"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="getStarTime">
        <el-date-picker
          v-model="queryParams.getStarTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button type="primary" 
          plain 
          @click="openForm"
          v-hasPermi = "['school:star:import']"
        >
          <Icon icon="ep:upload" class="mr-5px" /> 导入文件
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="学生姓名" prop="stuName" />
      <el-table-column label="六星类型" align="center" prop="type">
        <template #default="scope">
          <el-tag>{{ scope.row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="年级" align="center" prop="grade">
        <template #default="scope">
          {{ scope.row.grade }}级
          {{
            new Date().getFullYear() + (Math.floor(new Date().getMonth() / 8)) - scope.row.grade - 1999 < 7 ? '-' + (new Date().getFullYear() + (Math.floor(new Date().getMonth() / 8)) - scope.row.grade - 1999) + '年级' : ''
          }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="getStarTime"
        width="180"
      />
      <el-table-column :width="300" align="center" label="操作">
        <template #default="scope">
          <el-button
            v-hasPermi="['school:star:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['school:star:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <FileForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as SchoolApi from '@/api/school/star'
import FileForm from './FileForm.vue'

defineOptions({ name: 'SchoolStar' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: '',
  stuName: '',
  grade: undefined,
  getStarTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询角色列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SchoolApi.getStarPage(queryParams)
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
const formRef = ref()
const openForm = (type?: string, id?: number) => {
  formRef.value.open(type, id)
}

// /** 数据权限操作 */
// const dataPermissionFormRef = ref()
// const openDataPermissionForm = async (row: SchoolApi.RoleVO) => {
//   dataPermissionFormRef.value.open(row)
// }

// /** 菜单权限操作 */
// const assignMenuFormRef = ref()
// const openAssignMenuForm = async (row: SchoolApi.RoleVO) => {
//   assignMenuFormRef.value.open(row)
// }

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SchoolApi.deleteStar(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

// /** 导出按钮操作 */
// const handleExport = async () => {
//   try {
//     // 导出的二次确认
//     await message.exportConfirm()
//     // 发起导出
//     exportLoading.value = true
//     const data = await SchoolApi.exportRole(queryParams)
//     download.excel(data, '角色列表.xls')
//   } catch {
//   } finally {
//     exportLoading.value = false
//   }
// }

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
