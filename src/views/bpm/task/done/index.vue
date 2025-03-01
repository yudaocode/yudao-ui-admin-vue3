<template>
  <doc-alert title="审批通过、不通过、驳回" url="https://doc.iocoder.cn/bpm/task-todo-done/" />
  <doc-alert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />
  <doc-alert
    title="审批转办、委派、抄送"
    url="https://doc.iocoder.cn/bpm/task-delegation-and-cc/"
  />
  <doc-alert title="审批加签、减签" url="https://doc.iocoder.cn/bpm/sign/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入任务名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
      </el-form-item>

      <el-form-item label="" prop="category" :style="{ position: 'absolute', right: '300px' }">
        <el-select
          v-model="queryParams.category"
          placeholder="请选择流程分类"
          clearable
          class="!w-155px"
          @change="handleQuery"
        >
          <el-option
            v-for="category in categoryList"
            :key="category.code"
            :label="category.name"
            :value="category.code"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="" prop="status" :style="{ position: 'absolute', right: '130px' }">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择流程状态"
          clearable
          class="!w-155px"
          @change="handleQuery"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <!-- 高级筛选 -->
      <el-form-item :style="{ position: 'absolute', right: '0px' }">
        <el-popover
          :visible="showPopover"
          persistent
          :width="400"
          :show-arrow="false"
          placement="bottom-end"
        >
          <template #reference>
            <el-button @click="showPopover = !showPopover">
              <Icon icon="ep:plus" class="mr-5px" />高级筛选
            </el-button>
          </template>
          <el-form-item
            label="所属流程"
            class="font-bold"
            label-position="top"
            prop="processDefinitionKey"
          >
            <el-select
              v-model="queryParams.processDefinitionKey"
              placeholder="请选择流程定义"
              clearable
              @change="handleQuery"
              class="!w-390px"
            >
              <el-option
                v-for="item in processDefinitionList"
                :key="item.key"
                :label="item.name"
                :value="item.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="发起时间" class="bold-label" label-position="top" prop="createTime">
            <el-date-picker
              v-model="queryParams.createTime"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
              class="!w-240px"
            />
          </el-form-item>
          <el-form-item class="bold-label" label-position="top">
            <el-button @click="handleQuery"> 确认</el-button>
            <el-button @click="showPopover = false"> 取消</el-button>
            <el-button @click="resetQuery"> 清空</el-button>
          </el-form-item>
        </el-popover>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="流程" prop="processInstance.name" width="180" />
      <el-table-column label="摘要" prop="processInstance.summary" width="180">
        <template #default="scope">
          <div
            class="flex flex-col"
            v-if="scope.row.processInstance.summary && scope.row.processInstance.summary.length > 0"
          >
            <div v-for="(item, index) in scope.row.processInstance.summary" :key="index">
              <el-text type="info"> {{ item.key }} : {{ item.value }} </el-text>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="发起人"
        prop="processInstance.startUser.nickname"
        width="100"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="发起时间"
        prop="createTime"
        width="180"
      />
      <el-table-column align="center" label="当前任务" prop="name" width="180" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="任务开始时间"
        prop="createTime"
        width="180"
      />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="任务结束时间"
        prop="endTime"
        width="180"
      />
      <el-table-column align="center" label="审批状态" prop="status" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BPM_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="审批建议" prop="reason" min-width="180" />
      <el-table-column align="center" label="耗时" prop="durationInMillis" width="160">
        <template #default="scope">
          {{ formatPast2(scope.row.durationInMillis) }}
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        label="流程编号"
        prop="processInstanceId"
        :show-overflow-tooltip="true"
      />
      <el-table-column align="center" label="任务编号" prop="id" :show-overflow-tooltip="true" />
      <el-table-column align="center" label="操作" fixed="right" width="80">
        <template #default="scope">
          <el-button link type="primary" @click="handleAudit(scope.row)">历史</el-button>
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
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatPast2 } from '@/utils/formatTime'
import * as TaskApi from '@/api/bpm/task'
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import * as DefinitionApi from '@/api/bpm/definition'

defineOptions({ name: 'BpmDoneTask' })

const { push } = useRouter() // 路由

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const processDefinitionList = ref<any[]>([]) // 流程定义列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: '',
  category: undefined,
  status: undefined,
  processDefinitionKey: '',
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const categoryList = ref<CategoryVO[]>([]) // 流程分类列表
const showPopover = ref(false) // 高级筛选是否展示

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TaskApi.getTaskDonePage(queryParams)
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

/** 处理审批按钮 */
const handleAudit = (row: any) => {
  push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstance.id,
      taskId: row.id
    }
  })
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  categoryList.value = await CategoryApi.getCategorySimpleList()
  // 获取流程定义列表
  processDefinitionList.value = await DefinitionApi.getSimpleProcessDefinitionList()
})
</script>
