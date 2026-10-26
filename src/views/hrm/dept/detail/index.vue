<template>
  <DeptDetailsHeader
    :dept="dept"
    :leader-user-name="leaderUserName"
    :loading="loading"
    :parent-dept-name="parentDeptName"
    :statistics="statistics"
  >
    <el-space wrap>
      <el-button
        v-hasPermi="['system:dept:update']"
        :disabled="!dept.id"
        type="primary"
        @click="openDeptManagement"
      >
        <Icon icon="ep:edit" class="mr-5px" />
        编辑
      </el-button>
      <el-button
        v-hasPermi="['system:dept:delete']"
        :disabled="!dept.id"
        type="danger"
        plain
        @click="openDeptManagement"
      >
        <Icon icon="ep:delete" class="mr-5px" />
        删除
      </el-button>
    </el-space>
  </DeptDetailsHeader>

  <el-col v-loading="loading">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="详细资料" name="details">
        <DeptDetailsInfo
          :dept="dept"
          :leader-user-name="leaderUserName"
          :parent-dept-name="parentDeptName"
        />
      </el-tab-pane>
      <el-tab-pane label="员工列表" name="employees" lazy>
        <DeptEmployeeList v-if="dept.id" :dept-id="dept.id" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import { useTagsViewStore } from '@/store/modules/tagsView'
import * as EmployeeApi from '@/api/hrm/employee'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import DeptDetailsHeader from './DeptDetailsHeader.vue'
import DeptDetailsInfo from './DeptDetailsInfo.vue'
import DeptEmployeeList from './DeptEmployeeList.vue'

defineOptions({ name: 'HrmDeptDetail' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const deptId = (parseId(route.params.id) as number) // 部门编号
const loading = ref(true) // 详情加载中
const dept = ref<DeptApi.DeptVO>({} as DeptApi.DeptVO) // 部门详情
const parentDeptName = ref<string>() // 上级部门名称
const leaderUserName = ref<string>() // 部门负责人名称
const statistics = ref({
  activeCount: 0,
  fullTimeCount: 0,
  nonFullTimeCount: 0
}) // 部门直属员工统计
const activeTab = ref('details') // 当前页签

/** 关闭详情 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmDept' })
}

/** 查询组织详情 */
async function getData() {
  loading.value = true
  try {
    const [deptData, deptList, userList, statisticsList] = await Promise.all([
      DeptApi.getDept(deptId),
      DeptApi.getSimpleDeptList(),
      UserApi.getSimpleUserList(),
      EmployeeApi.getEmployeeDeptStatistics()
    ])
    if (!deptData) {
      message.warning('部门不存在')
      close()
      return
    }
    dept.value = deptData
    parentDeptName.value = deptList.find((item) => item.id === deptData.parentId)?.name
    leaderUserName.value = userList.find((item) => item.id === deptData.leaderUserId)?.nickname
    statistics.value = statisticsList.find((item) => item.deptId === deptId) || {
      activeCount: 0,
      fullTimeCount: 0,
      nonFullTimeCount: 0
    }
  } finally {
    loading.value = false
  }
}

/** 前往部门管理 */
function openDeptManagement() {
  push('/system/dept')
}

/** 初始化 */
onMounted(() => {
  if (!isPositiveId(deptId)) {
    message.warning('参数错误，部门不能为空！')
    close()
    return
  }
  getData()
})
</script>
