<template>
  <Dialog v-model="dialogVisible" title="推广人列表" width="75%">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="85px"
      >
        <el-form-item label="用户类型" prop="level">
          <el-radio-group v-model="queryParams.level" @change="handleQuery">
            <el-radio-button checked>全部</el-radio-button>
            <el-radio-button label="1">一级推广人</el-radio-button>
            <el-radio-button label="2">二级推广人</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.BROKERAGE_RECORD_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定时间" prop="createTime">
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
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column label="订单编号" align="center" prop="bizId" min-width="80px" />
        <el-table-column label="用户编号" align="center" prop="sourceUserId" min-width="80px" />
        <el-table-column label="头像" align="center" prop="sourceUserAvatar" width="70px">
          <template #default="scope">
            <el-avatar :src="scope.row.sourceUserAvatar" />
          </template>
        </el-table-column>
        <el-table-column label="昵称" align="center" prop="sourceUserNickname" min-width="80px" />
        <el-table-column
          label="佣金"
          align="center"
          prop="price"
          min-width="100px"
          :formatter="fenToYuanFormat"
        />
        <el-table-column label="状态" align="center" prop="status" min-width="85">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.BROKERAGE_RECORD_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
  </Dialog>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as BrokerageRecordApi from '@/api/mall/trade/brokerage/record'
import { BrokerageRecordBizTypeEnum } from '@/utils/constants'
import { fenToYuanFormat } from '@/utils/formatter'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** 推广订单列表 */
defineOptions({ name: 'BrokerageOrderListDialog' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: null,
  bizType: BrokerageRecordBizTypeEnum.ORDER.type,
  level: '',
  createTime: [],
  status: null
})
const queryFormRef = ref() // 搜索的表单

/** 打开弹窗 */
const dialogVisible = ref(false) // 弹窗的是否展示
const open = async (userId: any) => {
  dialogVisible.value = true
  queryParams.userId = userId
  resetQuery()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BrokerageRecordApi.getBrokerageRecordPage(queryParams)
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
</script>
