<template>
  <doc-alert title="支付功能开启" url="https://doc.iocoder.cn/pay/build/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="应用编号" prop="appId">
        <el-select clearable v-model="queryParams.appId" filterable placeholder="请选择应用信息">
          <el-option v-for="item in appList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="通知类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择通知类型" clearable size="small">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_NOTIFY_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联编号" prop="dataId">
        <el-input
          v-model="queryParams.dataId"
          placeholder="请输入关联编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="通知状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择通知状态" clearable>
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PAY_NOTIFY_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商户订单编号" prop="merchantOrderId">
        <el-input
          v-model="queryParams.merchantOrderId"
          placeholder="请输入商户订单编号"
          clearable
          @keyup.enter="handleQuery"
        />
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
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="任务编号" align="center" prop="id" />
      <el-table-column label="应用编号" align="center" prop="appName" />
      <el-table-column label="商户订单编号" align="center" prop="merchantOrderId" />
      <el-table-column label="通知类型" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_NOTIFY_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="关联编号" align="center" prop="dataId" />
      <el-table-column label="通知状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="最后通知时间"
        align="center"
        prop="lastExecuteTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column
        label="下次通知时间"
        align="center"
        prop="nextNotifyTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="通知次数" align="center" prop="notifyTimes">
        <template #default="scope">
          <el-tag size="small" type="success">
            {{ scope.row.notifyTimes }} / {{ scope.row.maxNotifyTimes }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-search"
            @click="handleDetail(scope.row)"
            v-hasPermi="['pay:notify:query']"
            >查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 对话框(详情) -->
  <el-dialog title="通知详情" v-model:visible="open" width="700px" append-to-body destroy-on-close>
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="商户订单编号">
        <el-tag size="small">{{ notifyDetail.merchantOrderId }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="通知状态">
        <dict-tag :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="notifyDetail.status" size="small" />
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="应用编号">{{ notifyDetail.appId }}</el-descriptions-item>
      <el-descriptions-item label="应用名称">{{ notifyDetail.appName }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="关联编号">{{ notifyDetail.dataId }}</el-descriptions-item>
      <el-descriptions-item label="通知类型">
        <dict-tag :type="DICT_TYPE.PAY_NOTIFY_TYPE" :value="notifyDetail.type" />
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="通知次数">{{ notifyDetail.notifyTimes }}</el-descriptions-item>
      <el-descriptions-item label="最大通知次数">{{
        notifyDetail.maxNotifyTimes
      }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="最后通知时间">{{
        formatDate(notifyDetail.lastExecuteTime)
      }}</el-descriptions-item>
      <el-descriptions-item label="下次通知时间">{{
        formatDate(notifyDetail.nextNotifyTime)
      }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions :column="2" label-class-name="desc-label">
      <el-descriptions-item label="创建时间">{{
        formatDate(notifyDetail.createTime)
      }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{
        formatDate(notifyDetail.updateTime)
      }}</el-descriptions-item>
    </el-descriptions>
    <!-- 分割线 -->
    <el-divider />
    <el-descriptions :column="1" label-class-name="desc-label" direction="vertical" border>
      <el-descriptions-item label="回调日志">
        <el-table :data="notifyDetail.logs">
          <el-table-column label="日志编号" align="center" prop="id" />
          <el-table-column label="通知状态" align="center" prop="status">
            <template #default="scope">
              <dict-tag :type="DICT_TYPE.PAY_NOTIFY_STATUS" :value="scope.row.status" />
            </template>
          </el-table-column>
          <el-table-column label="通知次数" align="center" prop="notifyTimes" />
          <el-table-column label="通知时间" align="center" prop="lastExecuteTime" width="180">
            <template #default="scope">
              <span>{{ formatDate(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="响应结果" align="center" prop="response" />
        </el-table>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script lang="ts" setup name="PayNotify">
import { getNotifyTaskPage, getNotifyTaskDetail } from '@/api/pay/notify'
import { getAppList } from '@/api/pay/app'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'

// 遮罩层
const loading = ref(true)
// 显示搜索条件
const showSearch = ref(true)
// 总条数
const total = ref(0)
// 支付通知列表
const list = ref([])
// 是否显示弹出层
const open = ref(false)
// 查询参数
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  appId: null,
  type: null,
  dataId: null,
  status: null,
  merchantOrderId: null,
  createTime: []
})

// 支付应用列表集合
const appList = ref([])
// 通知详情
const notifyDetail = ref<any>({
  logs: []
})

const queryFormRef = ref()

onMounted(async () => {
  await getList()
  // 获得筛选项
  const data = await getAppList()
  appList.value = data
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  // 执行查询
  const data = await getNotifyTaskPage(queryParams.value)
  list.value = data.list
  total.value = data.total
  loading.value = false
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 详情按钮操作 */
const handleDetail = async (row: any) => {
  notifyDetail.value = {}
  const data = await getNotifyTaskDetail(row.id)
  // 设置值
  notifyDetail.value = data
  // 弹窗打开
  open.value = true
}
</script>
