<!-- TODO 芋艿：这块后续抽个独立的组件出来 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="60%">
    <el-row :gutter="20">
      <!-- 左侧部门树 -->
      <el-col :span="4" :xs="24">
        <ContentWrap class="h-1/1">
          <DeptTree @node-click="handleDeptNodeClick" />
        </ContentWrap>
      </el-col>
      <el-col :span="20" :xs="24">
        <!-- 搜索 -->
        <ContentWrap>
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
            </el-form-item>
          </el-form>
        </ContentWrap>
        <ContentWrap>
          <el-table v-loading="loading" :data="list">
            <el-table-column width="55">
              <template #header>
                <el-checkbox
                  v-model="isCheckAll"
                  :indeterminate="isIndeterminate"
                  @change="handleCheckAll"
                />
              </template>
              <template #default="{ row }">
                <el-checkbox
                  v-model="checkedStatus[row.id]"
                  @change="(checked: boolean) => handleCheckOne(checked, row, true)"
                />
              </template>
            </el-table-column>
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
              prop="deptName"
              :show-overflow-tooltip="true"
            />
            <el-table-column label="手机号码" align="center" prop="mobile" width="120" />
            <el-table-column label="状态" key="status">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column
              label="创建时间"
              align="center"
              prop="createTime"
              :formatter="dateFormatter"
              width="180"
            />
          </el-table>
          <Pagination
            :total="total"
            v-model:page="queryParams.pageNo"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </ContentWrap>
      </el-col>
    </el-row>
    <template #footer>
      <el-button type="primary" @click="handleEmitChange">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as UserApi from '@/api/system/user'
import DeptTree from '@/views/system/user/DeptTree.vue'

// 是否全选
const isCheckAll = ref(false)
// 全选框是否处于中间状态：不是全部选中 && 任意一个选中
const isIndeterminate = ref(false)
// 选中的活动
const checkedUsers = ref([])
// 选中状态：key为用户ID，value为是否选中
const checkedStatus = ref<Record<string, boolean>>({})

const dialogTitle = '选择店员'
const dialogVisible = ref(false)
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
  roleId: 5,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UserApi.getUserPage(queryParams)
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

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  loading.value = true
  try {
    await getList()
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 全选/全不选 */
const handleCheckAll = (checked: boolean) => {
  isCheckAll.value = checked
  isIndeterminate.value = false

  list.value.forEach((combinationActivity) => handleCheckOne(checked, combinationActivity, false))
}

/**
 * 选中一行
 * @param checked 是否选中
 * @param combinationActivity 活动
 * @param isCalcCheckAll 是否计算全选
 */
const handleCheckOne = (checked: boolean, combinationActivity, isCalcCheckAll: boolean) => {
  if (checked) {
    checkedUsers.value.push(combinationActivity as never)
    checkedStatus.value[combinationActivity.id] = true
  } else {
    const index = findCheckedIndex(combinationActivity)
    if (index > -1) {
      checkedUsers.value.splice(index, 1)
      checkedStatus.value[combinationActivity.id] = false
      isCheckAll.value = false
    }
  }

  // 计算全选框状态
  if (isCalcCheckAll) {
    calculateIsCheckAll()
  }
}

// 查找活动在已选中活动列表中的索引
const findCheckedIndex = (user) => checkedUsers.value.findIndex((item) => item.id === user.id)

// 计算全选框状态
const calculateIsCheckAll = () => {
  isCheckAll.value = list.value.every((user) => checkedStatus.value[user.id])
  // 计算中间状态：不是全部选中 && 任意一个选中
  isIndeterminate.value =
    !isCheckAll.value && list.value.some((user) => checkedStatus.value[user.id])
}

/** 多选完成 */
const handleEmitChange = () => {
  // 关闭弹窗
  dialogVisible.value = false
  emits('change', [...checkedUsers.value])
}

/** 确认选择时的触发事件 */
const emits = defineEmits<{
  change: [CombinationActivityApi: any]
}>()
</script>
