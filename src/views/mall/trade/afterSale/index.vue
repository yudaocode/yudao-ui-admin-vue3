<template>
  <doc-alert title="【交易】售后退款" url="https://doc.iocoder.cn/mall/trade-aftersale/" />

  <!-- 搜索 -->
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" label-width="68px">
      <el-form-item label="商品名称" prop="spuName">
        <el-input
          v-model="queryParams.spuName"
          class="!w-280px"
          clearable
          placeholder="请输入商品 SPU 名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="退款编号" prop="no">
        <el-input
          v-model="queryParams.no"
          class="!w-280px"
          clearable
          placeholder="请输入退款编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单编号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          class="!w-280px"
          clearable
          placeholder="请输入订单编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="售后状态" prop="status">
        <el-select
          v-model="queryParams.status"
          class="!w-280px"
          clearable
          placeholder="请选择售后状态"
        >
          <el-option label="全部" value="0" />
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="售后方式" prop="way">
        <el-select
          v-model="queryParams.way"
          class="!w-280px"
          clearable
          placeholder="请选择售后方式"
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_WAY)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="售后类型" prop="type">
        <el-select
          v-model="queryParams.type"
          class="!w-280px"
          clearable
          placeholder="请选择售后类型"
        >
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_TYPE)"
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
          end-placeholder="自定义时间"
          start-placeholder="自定义时间"
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

  <ContentWrap>
    <el-tabs v-model="queryParams.status" @tab-click="tabClick">
      <el-tab-pane
        v-for="item in statusTabs"
        :key="item.label"
        :label="item.label"
        :name="item.value"
      />
    </el-tabs>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="退款编号" min-width="200" prop="no" />
      <el-table-column align="center" label="订单编号" min-width="200" prop="orderNo">
        <template #default="{ row }">
          <el-button link type="primary" @click="openOrderDetail(row.orderId)">
            {{ row.orderNo }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="商品信息" min-width="600" prop="spuName">
        <template #default="{ row }">
          <div class="flex items-center">
            <el-image
              :src="row.picUrl"
              class="mr-10px h-30px w-30px"
              @click="imagePreview(row.picUrl)"
            />
            <span class="mr-10px">{{ row.spuName }}</span>
            <el-tag v-for="property in row.properties" :key="property.propertyId" class="mr-10px">
              {{ property.propertyName }}: {{ property.valueName }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column align="center" label="订单金额" min-width="120" prop="refundPrice">
        <template #default="scope">
          <span>{{ fenToYuan(scope.row.refundPrice) }} 元</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="买家" prop="user.nickname" />
      <el-table-column align="center" label="申请时间" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ formatDate(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="售后状态" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="售后方式">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.TRADE_AFTER_SALE_WAY" :value="scope.row.way" />
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openAfterSaleDetail(row.id)">处理退款</el-button>
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
import * as AfterSaleApi from '@/api/mall/trade/afterSale/index'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { createImageViewer } from '@/components/ImageViewer'
import { TabsPaneContext } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { fenToYuan } from '@/utils'

defineOptions({ name: 'TradeAfterSale' })

const { push } = useRouter() // 路由跳转

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<AfterSaleApi.TradeAfterSaleVO[]>([]) // 列表的数据
const statusTabs = ref([
  {
    label: '全部',
    value: '0'
  }
])
const queryFormRef = ref() // 搜索的表单
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  no: null,
  status: '0',
  orderNo: null,
  spuName: null,
  createTime: [],
  way: null,
  type: null
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = cloneDeep(queryParams)
    // 处理掉全部的状态，不传就是全部
    if (data.status === '0') {
      delete data.status
    }
    // 执行查询
    const res = await AfterSaleApi.getAfterSalePage(data)
    list.value = res.list as AfterSaleApi.TradeAfterSaleVO[]
    total.value = res.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = async () => {
  queryParams.pageNo = 1
  await getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** tab 切换 */
const tabClick = async (tab: TabsPaneContext) => {
  queryParams.status = tab.paneName
  await getList()
}

/** 处理退款 */
const openAfterSaleDetail = (id: number) => {
  push({ name: 'TradeAfterSaleDetail', params: { id } })
}

/** 查看订单详情 */
const openOrderDetail = (id: number) => {
  push({ name: 'TradeOrderDetail', params: { id } })
}

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

onMounted(async () => {
  await getList()
  // 设置 statuses 过滤
  for (const dict of getDictOptions(DICT_TYPE.TRADE_AFTER_SALE_STATUS)) {
    statusTabs.value.push({
      label: dict.label,
      value: dict.value
    })
  }
})
</script>
