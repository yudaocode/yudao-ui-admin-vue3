<template>
  <div class="app-container">
    <content-wrap>
      <!-- 搜索工作栏 -->
      <el-row :gutter="20">
        <!--部门数据-->
        <el-col :span="4" :xs="24">
          <UserDeptTree @node-click="handleDeptNodeClick" />
        </el-col>
        <!--用户数据-->
        <el-col :span="20" :xs="24">
          <el-form
            :model="queryParams"
            ref="queryFormRef"
            :inline="true"
            v-show="showSearch"
            label-width="68px"
          >
            <el-form-item label="用户名称" prop="username">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入用户名称"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="手机号码" prop="mobile">
              <el-input
                v-model="queryParams.mobile"
                placeholder="请输入手机号码"
                clearable
                style="width: 240px"
                @keyup.enter="handleQuery"
              />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="queryParams.status"
                placeholder="用户状态"
                clearable
                style="width: 240px"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                  :key="dict.value as number"
                  :label="dict.label"
                  :value="dict.value as number"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间" prop="createTime">
              <el-date-picker
                v-model="queryParams.createTime"
                style="width: 240px"
                value-format="YYYY-MM-DD HH:mm:ss"
                type="datetimerange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery"
                ><Icon icon="ep:search" />搜索</el-button
              >
              <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="10" class="mb-8px">
            <el-col :span="1.5">
              <el-button
                type="primary"
                plain
                size="small"
                @click="handleAdd"
                v-hasPermi="['system:user:create']"
                ><Icon icon="ep:plus" />新增</el-button
              >
            </el-col>
            <el-col :span="1.5">
              <el-button
                type="info"
                size="small"
                @click="handleImport"
                v-hasPermi="['system:user:import']"
                ><Icon icon="ep:upload" />导入</el-button
              >
            </el-col>
            <el-col :span="1.5">
              <el-button
                type="warning"
                size="small"
                @click="handleExport"
                :loading="exportLoading"
                v-hasPermi="['system:user:export']"
                ><Icon icon="ep:download" />导出</el-button
              >
            </el-col>
          </el-row>
          <el-table v-loading="loading" :data="userList">
            <el-table-column
              label="用户编号"
              align="center"
              key="id"
              prop="id"
              v-if="columns[0].visible"
            />
            <el-table-column
              label="用户名称"
              align="center"
              key="username"
              prop="username"
              v-if="columns[1].visible"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="用户昵称"
              align="center"
              key="nickname"
              prop="nickname"
              v-if="columns[2].visible"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="部门"
              align="center"
              key="deptName"
              prop="dept.name"
              v-if="columns[3].visible"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="手机号码"
              align="center"
              key="mobile"
              prop="mobile"
              v-if="columns[4].visible"
              width="120"
            />
            <el-table-column label="状态" key="status" v-if="columns[5].visible" align="center">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  :active-value="0"
                  :inactive-value="1"
                  @change="handleStatusChange(scope.row)"
                />
              </template>
            </el-table-column>
            <el-table-column
              label="创建时间"
              align="center"
              prop="createTime"
              v-if="columns[6].visible"
              width="160"
            >
              <template #default="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="160"
              class-name="small-padding fixed-width"
            >
              <template #default="scope">
                <div class="flex justify-center items-center">
                  <el-button
                    type="primary"
                    link
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['system:user:update']"
                    ><Icon icon="ep:edit" />修改</el-button
                  >
                  <el-dropdown
                    @command="(command) => handleCommand(command, scope.$index, scope.row)"
                    v-hasPermi="[
                      'system:user:delete',
                      'system:user:update-password',
                      'system:permission:assign-user-role'
                    ]"
                  >
                    <el-button type="primary" link><Icon icon="ep:d-arrow-right" />更多</el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <!-- div包住避免控制台报错：Runtime directive used on component with non-element root node -->
                        <div v-if="scope.row.id !== 1" v-hasPermi="['system:user:delete']">
                          <el-dropdown-item command="handleDelete" type="text"
                            ><Icon icon="ep:delete" />删除</el-dropdown-item
                          >
                        </div>
                        <div v-hasPermi="['system:user:update-password']">
                          <el-dropdown-item command="handleResetPwd" type="text"
                            ><Icon icon="ep:key" />重置密码</el-dropdown-item
                          ></div
                        >
                        <div v-hasPermi="['system:permission:assign-user-role']">
                          <el-dropdown-item command="handleRole" type="text"
                            ><Icon icon="ep:circle-check" />分配角色</el-dropdown-item
                          ></div
                        >
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNo"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </el-col>
      </el-row>
    </content-wrap>
    <!-- 添加或修改用户对话框 -->
    <UserForm ref="userFormRef" @success="getList" />
    <!-- 用户导入对话框 -->
    <UserImportForm ref="userImportFormRef" @success="getList" />
    <!-- 分配角色 -->
    <UserAssignRoleForm ref="userAssignRoleFormRef" @success="getList" />
  </div>
</template>

<script setup lang="ts" name="User">
import download from '@/utils/download'
import { parseTime } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'

import {
  deleteUserApi,
  exportUserApi,
  resetUserPwdApi,
  updateUserStatusApi,
  getUserPageApi,
  UserVO
} from '@/api/system/user'

import UserForm from './components/UserForm.vue'
import UserImportForm from './components/UserImportForm.vue'
import UserAssignRoleForm from './components/UserAssignRoleForm.vue'
import UserDeptTree from './components/UserDeptTree.vue'

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  username: undefined,
  mobile: undefined,
  status: undefined,
  deptId: undefined,
  createTime: []
})
const showSearch = ref(true)

const handleDeptNodeClick = async (row: { [key: string]: any }) => {
  queryParams.deptId = row.id
  getList()
}

// 用户列表
const userList = ref<UserVO[]>([])
const loading = ref(false)
const total = ref(0)
const columns = ref([
  { key: 0, label: `用户编号`, visible: true },
  { key: 1, label: `用户名称`, visible: true },
  { key: 2, label: `用户昵称`, visible: true },
  { key: 3, label: `部门`, visible: true },
  { key: 4, label: `手机号码`, visible: true },
  { key: 5, label: `状态`, visible: true },
  { key: 6, label: `创建时间`, visible: true }
])
/* 查询列表 */
const getList = () => {
  loading.value = true
  getUserPageApi(queryParams).then((response) => {
    userList.value = response.list
    total.value = response.total
    loading.value = false
  })
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const queryFormRef = ref()
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

// 添加或编辑
const userFormRef = ref()
// 添加用户
const handleAdd = () => {
  userFormRef.value?.openForm()
}

// 用户导入
const userImportFormRef = ref()
const handleImport = () => {
  userImportFormRef.value?.openForm()
}

// 用户导出
const exportLoading = ref(false)
const handleExport = () => {
  message
    .confirm('是否确认导出所有用户数据项?')
    .then(async () => {
      // 处理查询参数
      let params = { ...queryParams }
      params.pageNo = 1
      params.pageSize = 99999
      exportLoading.value = true
      const response = await exportUserApi(params)
      download.excel(response, '用户数据.xls')
    })
    .catch(() => {})
    .finally(() => {
      exportLoading.value = false
    })
}

// 操作分发
const handleCommand = (command: string, index: number, row: UserVO) => {
  console.log(index)
  switch (command) {
    case 'handleUpdate':
      handleUpdate(row) //修改客户信息
      break
    case 'handleDelete':
      handleDelete(row) //红号变更
      break
    case 'handleResetPwd':
      handleResetPwd(row)
      break
    case 'handleRole':
      handleRole(row)
      break
    default:
      break
  }
}

// 用户状态修改
const handleStatusChange = (row: UserVO) => {
  let text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  message
    .confirm('确认要"' + text + '""' + row.username + '"用户吗?', t('common.reminder'))
    .then(async () => {
      row.status =
        row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE
      await updateUserStatusApi(row.id, row.status)
      message.success(text + '成功')
      // 刷新列表
      getList()
    })
    .catch(() => {
      row.status =
        row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
    })
}

// 具体数据单行操作
/** 修改按钮操作 */
const handleUpdate = (row: UserVO) => {
  userFormRef.value?.openForm(row)
}

// 删除用户
const handleDelete = (row: UserVO) => {
  const ids = row.id
  message
    .confirm('是否确认删除用户编号为"' + ids + '"的数据项?')
    .then(async () => {
      await deleteUserApi(ids)
      message.success('删除成功')
      getList()
    })
    .catch((e) => {
      console.error(e)
    })
}

// 重置密码
const handleResetPwd = (row: UserVO) => {
  message
    .prompt('请输入"' + row.username + '"的新密码', t('common.reminder'))
    .then(async ({ value }) => {
      await resetUserPwdApi(row.id, value)
      message.success('修改成功，新密码是：' + value)
    })
    .catch((e) => {
      console.error(e)
    })
}

// 分配角色
const userAssignRoleFormRef = ref()
const handleRole = (row: UserVO) => {
  userAssignRoleFormRef.value?.openForm(row)
}

// ========== 初始化 ==========
onMounted(async () => {
  getList()
})
</script>
