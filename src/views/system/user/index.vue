<template>
  <el-row :gutter="20">
    <!-- 左侧部门树 -->
    <el-col :span="4" :xs="24">
      <content-wrap class="h-1/1">
        <DeptTree @node-click="handleDeptNodeClick" />
      </content-wrap>
    </el-col>
    <el-col :span="20" :xs="24">
      <!-- 搜索 -->
      <content-wrap>
        <el-form
          class="-mb-15px"
          :model="queryParams"
          ref="queryFormRef"
          :inline="true"
          label-width="68px"
        >
          <el-form-item label="用户名称" prop="username">
            <el-input
              v-model="queryParams.username"
              placeholder="请输入用户名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="手机号码" prop="mobile">
            <el-input
              v-model="queryParams.mobile"
              placeholder="请输入手机号码"
              clearable
              @keyup.enter="handleQuery"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="queryParams.status"
              placeholder="用户状态"
              clearable
              class="!w-240px"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" prop="createTime">
            <el-date-picker
              v-model="queryParams.createTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="datetimerange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
            <el-button
              type="primary"
              plain
              @click="openForm('create')"
              v-hasPermi="['system:user:create']"
            >
              <Icon icon="ep:plus" /> 新增
            </el-button>
            <el-button type="info" plain @click="handleImport" v-hasPermi="['system:user:import']">
              <Icon icon="ep:upload" /> 导入
            </el-button>
            <el-button
              type="warning"
              plain
              @click="handleExport"
              :loading="exportLoading"
              v-hasPermi="['system:user:export']"
            >
              <Icon icon="ep:download" />导出
            </el-button>
          </el-form-item>
        </el-form>
      </content-wrap>
      <content-wrap>
        <el-table v-loading="loading" :data="list">
          <el-table-column label="用户编号" align="center" key="id" prop="id" />
          <el-table-column
            label="用户名称"
            align="center"
            prop="username"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="用户昵称"
            align="center"
            prop="nickname"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="部门"
            align="center"
            key="deptName"
            prop="dept.name"
            :show-overflow-tooltip="true"
          />
          <el-table-column label="手机号码" align="center" prop="mobile" width="120" />
          <el-table-column label="状态" key="status">
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
            :formatter="dateFormatter"
            width="180"
          />
          <el-table-column label="操作" align="center" width="160">
            <template #default="scope">
              <div class="flex justify-center items-center">
                <el-button
                  type="primary"
                  link
                  @click="openForm('update', scope.row.id)"
                  v-hasPermi="['system:user:update']"
                >
                  <Icon icon="ep:edit" />修改
                </el-button>
                <el-dropdown
                  @command="(command) => handleCommand(command, scope.$index, scope.row)"
                  v-hasPermi="[
                    'system:user:delete',
                    'system:user:update-password',
                    'system:permission:assign-user-role'
                  ]"
                >
                  <el-button type="primary" link><Icon icon="ep:d-arrow-right" /> 更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <!-- div包住避免控制台报错：Runtime directive used on component with non-element root node -->
                      <div v-hasPermi="['system:user:delete']">
                        <el-dropdown-item command="handleDelete">
                          <Icon icon="ep:delete" />删除
                        </el-dropdown-item>
                      </div>
                      <div v-hasPermi="['system:user:update-password']">
                        <el-dropdown-item command="handleResetPwd">
                          <Icon icon="ep:key" />重置密码
                        </el-dropdown-item>
                      </div>
                      <div v-hasPermi="['system:permission:assign-user-role']">
                        <el-dropdown-item command="handleRole">
                          <Icon icon="ep:circle-check" />分配角色
                        </el-dropdown-item>
                      </div>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </content-wrap>
    </el-col>
  </el-row>

  <!-- 添加或修改用户对话框 -->
  <UserForm ref="formRef" @success="getList" />
  <!-- 用户导入对话框 -->
  <UserImportForm ref="importFormRef" @success="getList" />
  <!-- 分配角色 -->
  <UserAssignRoleForm ref="assignRoleFormRef" @success="getList" />
</template>

<script setup lang="ts" name="User">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { CommonStatusEnum } from '@/utils/constants'

import { resetUserPwdApi, updateUserStatusApi, UserVO } from '@/api/system/user'
import * as UserApi from '@/api/system/user'

import UserForm from './components/UserForm.vue'
import UserImportForm from './components/UserImportForm.vue'
import UserAssignRoleForm from './components/UserAssignRoleForm.vue'
import DeptTree from './DeptTree.vue'
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  username: undefined,
  mobile: undefined,
  status: undefined,
  deptId: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UserApi.getUserPage(queryParams.value)
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
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 处理部门被点击 */
const handleDeptNodeClick = async (row) => {
  queryParams.deptId = row.id
  await getList()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

// 用户导入
const importFormRef = ref()
const handleImport = () => {
  importFormRef.value?.openForm()
}

// 操作分发
const handleCommand = (command: string, index: number, row: UserApi.UserVO) => {
  console.log(index)
  switch (command) {
    case 'handleDelete':
      handleDelete(row.id)
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

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await UserApi.deleteUser(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const exportLoading = ref(false)
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await UserApi.exportUser(queryParams)
    download.excel(data, '用户数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
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
const assignRoleFormRef = ref()
const handleRole = (row: UserVO) => {
  assignRoleFormRef.value?.openForm(row)
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
