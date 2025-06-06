<template>
  <Dialog v-model="dialogVisible" title="推广订单列表" width="75%">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="85px"
      >
        <el-form-item label="用户类型" prop="sourceUserLevel">
          <el-radio-group v-model="queryParams.sourceUserLevel" @change="handleQuery">
            <el-radio-button :value="0">全部</el-radio-button>
            <el-radio-button :value="1">一级推广人</el-radio-button>
            <el-radio-button :value="2">二级推广人</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            class="!w-240px"
            clearable
            placeholder="请选择状态"
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
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true" :stripe="true">
        <el-table-column align="center" label="订单编号" min-width="80px" prop="bizId" />
        <el-table-column align="center" label="用户编号" min-width="80px" prop="sourceUserId" />
        <el-table-column align="center" label="头像" prop="sourceUserAvatar" width="70px">
          <template #default="scope">
            <el-avatar :src="scope.row.sourceUserAvatar" />
          </template>
        </el-table-column>
        <el-table-column align="center" label="昵称" min-width="80px" prop="sourceUserNickname" />
        <el-table-column
          :formatter="fenToYuanFormat"
          align="center"
          label="佣金"
          min-width="100px"
          prop="price"
        />
        <el-table-column align="center" label="状态" min-width="85" prop="status">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.BROKERAGE_RECORD_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="创建时间"
          prop="createTime"
          width="180px"
        />
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
  </Dialog>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as BrokerageRecordApi from '@/api/mall/trade/brokerage/record'
import { BrokerageRecordBizTypeEnum } from '@/utils/constants'
import { fenToYuanFormat } from '@/utils/formatter'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** 推广订单列表 */
defineOptions({ name: 'BrokerageOrderListDialog' })

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: null,
  bizType: BrokerageRecordBizTypeEnum.ORDER.type,
  sourceUserLevel: 0,
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
    // 处理全部的情况
    const data = await BrokerageRecordApi.getBrokerageRecordPage({
      ...queryParams,
      sourceUserLevel: queryParams.sourceUserLevel === 0 ? undefined : queryParams.sourceUserLevel
    })
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
