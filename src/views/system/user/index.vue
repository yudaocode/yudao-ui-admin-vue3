<template>
  <div class="app-container">
    <!-- 搜索工作栏 -->
    <el-row :gutter="20">
      <!--部门数据-->
      <el-col :span="4" :xs="24">
        <div class="head-container">
          <el-input
            v-model="deptName"
            placeholder="请输入部门名称"
            clearable
            size="small"
            style="margin-bottom: 20px"
          >
            <template #prefix>
              <Icon icon="ep:search" />
            </template>
          </el-input>
        </div>
        <div class="head-container">
          <el-tree
            :data="deptOptions"
            :props="defaultProps"
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            ref="treeRef"
            node-key="id"
            default-expand-all
            highlight-current
            @node-click="handleDeptNodeClick"
          />
        </div>
      </el-col>
      <!--用户数据-->
      <el-col :span="20" :xs="24">
        <el-form
          :model="queryParams"
          ref="queryForm"
          size="small"
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
                v-for="dict in statusDictDatas"
                :key="parseInt(dict.value)"
                :label="dict.label"
                :value="parseInt(dict.value)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间" prop="createTime">
            <el-date-picker
              v-model="queryParams.createTime"
              style="width: 240px"
              value-format="yyyy-MM-dd HH:mm:ss"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="['00:00:00', '23:59:59']"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
            <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
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
          <!-- <right-toolbar
            :showSearch.sync="showSearch"
            @queryTable="getList"
            :columns="columns"
          ></right-toolbar> -->
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
              <el-button
                size="small"
                type="text"
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
                <el-button size="small" type="text"><Icon icon="ep:d-arrow-right" />更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      command="handleDelete"
                      v-if="scope.row.id !== 1"
                      size="small"
                      type="text"
                      v-hasPermi="['system:user:delete']"
                      ><Icon icon="ep:delete" />删除</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="handleResetPwd"
                      size="small"
                      type="text"
                      v-hasPermi="['system:user:update-password']"
                      ><Icon icon="ep:key" />重置密码</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="handleRole"
                      size="small"
                      type="text"
                      v-hasPermi="['system:permission:assign-user-role']"
                      ><Icon icon="ep:circle-check" />分配角色</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
  </div>
</template>

<script setup lang="ts" name="User">
import type { ElTree } from 'element-plus'
import { handleTree, defaultProps } from '@/utils/tree'
import { listSimpleDeptApi } from '@/api/system/dept'
import { listSimplePostsApi, PostVO } from '@/api/system/post'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { UserVO } from '@/api/system/user'
import {
  // createUserApi,
  // updateUserStatusApi,
  // deleteUserApi,
  // exportUserApi,
  // getUserApi,
  // importUserTemplateApi,
  getUserPageApi
  // resetUserPwdApid,
  // updateUserApi
} from '@/api/system/user'

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
// 数据字典
const statusDictDatas = getDictOptions(DICT_TYPE.COMMON_STATUS)
// const sexDictDatas = getDictOptions(DICT_TYPE.SYSTEM_USER_SEX)

// ========== 创建部门树结构 ==========
const deptName = ref('')
const deptOptions = ref<Tree[]>([]) // 树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()
const getTree = async () => {
  const res = await listSimpleDeptApi()
  deptOptions.value.push(...handleTree(res))
}
const filterNode = (value: string, data: Tree) => {
  if (!value) return true
  return data.name.includes(value)
}
const handleDeptNodeClick = async (row: { [key: string]: any }) => {
  queryParams.deptId = row.id
  // await reload()
  getList()
}
// 获取岗位列表
const postOptions = ref<PostVO[]>([]) //岗位列表
const getPostOptions = async () => {
  const res = await listSimplePostsApi()
  postOptions.value.push(...res)
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
const getList = () => {
  loading.value = true
  getUserPageApi(queryParams).then((response) => {
    userList.value = response.list
    total.value = response.total
    loading.value = false
  })
}
const handleQuery = () => {}
const resetQuery = () => {}
const handleAdd = () => {}
const handleImport = () => {}
const exportLoading = ref(false)
const handleExport = () => {}
const handleStatusChange = () => {}
const handleUpdate = () => {}
const handleCommand = () => {}
// ========== 初始化 ==========
onMounted(async () => {
  getList()
  await getPostOptions()
  await getTree()
})

const parseTime = (time) => {
  if (!time) {
    return null
  }
  const format = '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
      time = parseInt(time)
    } else if (typeof time === 'string') {
      time = time
        .replace(new RegExp(/-/gm), '/')
        .replace('T', ' ')
        .replace(new RegExp(/\.[\d]{3}/gm), '')
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
    let value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value]
    }
    if (result.length > 0 && value < 10) {
      value = '0' + value
    }
    return value || 0
  })
  return time_str
}
</script>
