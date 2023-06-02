<template>
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
      :inline="true"
    >
      <el-form-item label="订单状态" prop="status">
        <el-select class="!w-280px" v-model="queryParams.status" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="支付方式" prop="payChannelCode">
        <el-select
          v-model="queryParams.payChannelCode"
          class="!w-280px"
          clearable
          placeholder="全部"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-280px"
          start-placeholder="自定义时间"
          end-placeholder="自定义时间"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="订单来源" prop="terminal">
        <el-select class="!w-280px" v-model="queryParams.terminal" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TERMINAL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="type">
        <el-select class="!w-280px" v-model="queryParams.type" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="订单搜索" prop="searchValue">
        <el-input class="!w-280px" v-model="queryParams.searchValue" clearable placeholder="请输入">
          <template #prepend>
            <el-select
              style="width: 100px"
              v-model="queryParams.searchType"
              clearable
              placeholder="全部"
            >
              <el-option
                v-for="dict in searchList"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </template>
        </el-input>
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
  <!-- 表格 -->
  <ContentWrap>
    <!-- 表单 -->
    <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
      <el-table-column type="expand" fixed="left">
        <template #default="scope">
          <el-descriptions class="mx-40">
            <el-descriptions-item label="商品原价(总): ">{{
              '￥ ' + parseFloat(scope.row.originalPrice / 100).toFixed(2) + ' 元'
            }}</el-descriptions-item>
            <el-descriptions-item label="下单时间: ">
              {{ formatDate(scope.row.createTime) }}</el-descriptions-item
            >
            <el-descriptions-item label="推广人: ">TODO</el-descriptions-item>
            <el-descriptions-item label="用户备注: ">{{
              scope.row.userRemark
            }}</el-descriptions-item>
            <el-descriptions-item label="商家备注: ">{{ scope.row.remark }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <el-table-column label="全选" type="selection" width="55" fixed="left" />

      <el-table-column label="订单号" align="center" min-width="110">
        <template #default="scope">
          <el-button link type="primary" @click="goOrderDetail(scope.row)">{{
            scope.row.no
          }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="订单类型" align="center" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>

      <el-table-column label="订单来源" align="center" min-width="100">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.terminal"
            :type="DICT_TYPE.TERMINAL"
            :value="scope.row.terminal"
          />
          <span v-else>{{ scope.terminal }}</span>
        </template>
      </el-table-column>

      <el-table-column label="用户信息(id)" align="center" min-width="100">
        <template #default="scope">
          <el-button link type="primary" @click="goUserDetail(scope.row)">{{
            scope.row.userId
          }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="商品信息" align="left" min-width="200" prop="items">
        <template #default="scope">
          <el-popover
            ref="popover"
            placement="bottom"
            :title="'订单:' + scope.row.no"
            :width="400"
            trigger="hover"
          >
            <template #reference>
              <div>
                <div v-for="item in scope.row.items" :key="item">
                  <el-image
                    style="width: 36px; height: 36px"
                    :src="item.picUrl"
                    :preview-src-list="[item.picUrl]"
                    fit="cover"
                    @click="imagePreview(item.picUrl)"
                  />
                  <span class="m-2">{{ item.spuName }}</span>
                </div>
              </div>
            </template>
            <div v-for="item in scope.row.items" :key="item">
              <div>
                <p>{{ item.spuName }}</p>
                <p>{{
                  '￥ ' + parseFloat(item.payPrice / 100).toFixed(2) + '元 x ' + item.count
                }}</p>
              </div>
            </div>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column label="实际支付(元)" align="center" prop="payPrice" min-width="100">
        <template #default="scope">
          {{ '￥ ' + parseFloat(scope.row.payPrice / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="支付时间"
        prop="payTime"
        min-width="180"
      />
      <el-table-column label="支付类型" align="center" min-width="100" prop="payChannelCode">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.payChannelCode"
            :type="DICT_TYPE.PAY_CHANNEL_CODE_TYPE"
            :value="scope.row.payChannelCode"
          />
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.status == ''"
            :type="DICT_TYPE.TRADE_ORDER_STATUS"
            :value="scope.row.status"
          />
          <span v-else>{{ scope.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" min-width="150">
        <template #default="scope">
          <el-button link type="primary" @click="sendXX(scope.row)">发货</el-button>
          <el-button link type="primary" @click="goOrderDetail(scope.row)">详情</el-button>
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
  <el-image-viewer
    v-if="imgViewVisible"
    :url-list="imageViewerList"
    @close="imgViewVisible = false"
  />
</template>
<script setup lang="ts" name="OrderList">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import * as TradeOrderApi from '@/api/mall/trade/order'
import { dateFormatter, formatDate } from '@/utils/formatTime'

const queryFormRef = ref() //表单搜索
const queryParams = ref({
  pageNo: 1, //首页
  pageSize: 10, //页面大小
  searchType: '',
  searchValue: ''
})
const loading = ref(false)
// 总记录数
const total = ref(0)
//表数据
const list = ref<any>([])
//订单搜索
const searchList = ref([
  {
    value: 'orderNo',
    label: '订单号'
  },
  {
    value: 'userId',
    label: '用户UID'
  },
  {
    value: 'userName',
    label: '用户姓名'
  },
  {
    value: 'userTel',
    label: '用户电话'
  },
  {
    value: 'itemName',
    label: '商品名称'
  },
  {
    value: 'itemCount',
    label: '商品件数'
  }
])

const imgViewVisible = ref(false) // 商品图预览
const imageViewerList = ref<string[]>([]) // 商品图预览列表
/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  console.log(queryParams)
  handleQuery()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await TradeOrderApi.getOrderList(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/**
 * 跳转订单详情
 */
const goOrderDetail = (row: any) => {
  console.log('TODO Order Detail: ' + row.no)
}

/**
 * 跳转用户详情
 */
const goUserDetail = (row: any) => {
  console.log('TODO User Detail: ' + row.userId)
}
/**
 * 发货
 */
const sendXX = (row: any) => {
  console.log('TODO Send XX: ' + row.no)
}

const handleSelectionChange = (val: list) => {
  multipleSelection.value = val
}

/**
 * 商品图预览
 * @param imgUrl
 */
const imagePreview = (imgUrl: string) => {
  imageViewerList.value = [imgUrl]
  imgViewVisible.value = true
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
