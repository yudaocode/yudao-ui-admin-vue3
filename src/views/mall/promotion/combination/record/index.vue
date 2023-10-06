<template>
  <!-- 统计信息展示 -->
  <el-row :gutter="12">
    <el-col :span="6">
      <ContentWrap class="h-[110px] pb-0!">
        <div class="flex items-center">
          <div
            class="h-[50px] w-[50px] flex items-center justify-center"
            style="color: rgb(24, 144, 255); background-color: rgba(24, 144, 255, 0.1)"
          >
            <Icon :size="23" icon="fa:user-times" />
          </div>
          <div class="ml-[20px]">
            <div class="mb-8px text-14px text-gray-400">参与人数(个)</div>
            <CountTo
              :duration="2600"
              :end-val="recordSummary.userCount"
              :start-val="0"
              class="text-20px"
            />
          </div>
        </div>
      </ContentWrap>
    </el-col>
    <el-col :span="6">
      <ContentWrap class="h-[110px]">
        <div class="flex items-center">
          <div
            class="h-[50px] w-[50px] flex items-center justify-center"
            style="color: rgb(162, 119, 255); background-color: rgba(162, 119, 255, 0.1)"
          >
            <Icon :size="23" icon="fa:user-plus" />
          </div>
          <div class="ml-[20px]">
            <div class="mb-8px text-14px text-gray-400">成团数量(个)</div>
            <CountTo
              :duration="2600"
              :end-val="recordSummary.successCount"
              :start-val="0"
              class="text-20px"
            />
          </div>
        </div>
      </ContentWrap>
    </el-col>
    <el-col :span="6">
      <ContentWrap class="h-[110px]">
        <div class="flex items-center">
          <div
            class="h-[50px] w-[50px] flex items-center justify-center"
            style="color: rgb(162, 119, 255); background-color: rgba(162, 119, 255, 0.1)"
          >
            <Icon :size="23" icon="fa:user-plus" />
          </div>
          <div class="ml-[20px]">
            <div class="mb-8px text-14px text-gray-400">虚拟成团(个)</div>
            <CountTo
              :duration="2600"
              :end-val="recordSummary.virtualGroupCount"
              :start-val="0"
              class="text-20px"
            />
          </div>
        </div>
      </ContentWrap>
    </el-col>
  </el-row>

  <ContentWrap>
    <!-- 检索条件 -->
    <div class="mb-[10px]">
      <span class="font-size-[14px]" style="font-weight: bold; color: #606266">时间段：</span>
      <el-date-picker
        v-model="queryParams.createTime"
        :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
        class="!w-240px"
        end-placeholder="结束日期"
        start-placeholder="开始日期"
        type="daterange"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <span class="ml-[10px] font-size-[14px] font-bold" style="color: #606266">拼团状态：</span>
      <el-select v-model="queryParams.status" class="!w-240px" clearable placeholder="全部">
        <el-option
          v-for="(dict, index) in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
          :key="index"
          :label="dict.label"
          :value="dict.value"
        />
      </el-select>
    </div>
    <!--   分页列表数据展示   -->
    <el-tabs v-model="queryParams.dateType" @tab-click="handleTabClick">
      <el-tab-pane
        v-for="item in tabsData"
        :key="item.type"
        :label="item.name + '(' + item.count + ')'"
        :name="item.value"
      />
    </el-tabs>
    <el-table v-loading="loading" :data="pageList">
      <el-table-column align="center" label="编号" prop="id" />
      <!-- TODO 是否需要做一个点击用户头像跳转或查看用户信息的功能  -->
      <el-table-column align="center" label="头像" prop="avatars" />
      <el-table-column align="center" label="开团团长" prop="avatar" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="开团时间"
        prop="startTime"
        width="180"
      />
      <el-table-column
        align="center"
        label="拼团商品"
        prop="type"
        show-overflow-tooltip
        width="300"
      >
        <template #defaul="{ row }">
          <el-image
            :src="row.picUrl"
            class="mr-5px h-30px w-30px align-middle"
            @click="imagePreview(row.picUrl)"
          />
          <span class="align-middle">{{ row.spuName }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="几人团" prop="userSize" />
      <el-table-column align="center" label="参与人数" prop="userCount" />
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="结束时间"
        prop="endTime"
        width="180"
      />
      <el-table-column align="center" label="拼团状态" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template #default></template>
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
import { dateFormatter } from '@/utils/formatTime'
import { createImageViewer } from '@/components/ImageViewer'
import * as CombinationRecordApi from '@/api/mall/promotion/combination/combinationRecord'
import { TabsPaneContext } from 'element-plus'

defineOptions({ name: 'CombinationRecord' })
const queryParams = ref({
  dateType: 0, // 日期类型
  status: undefined, // 拼团状态
  createTime: undefined, // 创建时间
  pageSize: 10,
  pageNo: 1
})
const loading = ref(true) // 列表的加载中
const total = ref(0) // 总记录数
const pageList = ref([]) // 分页数据
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CombinationRecordApi.getCombinationRecordPage(queryParams.value)
    pageList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
// 拼团统计数据
const recordSummary = ref({
  successCount: 0,
  userCount: 0,
  virtualGroupCount: 0
})
/** 获得拼团记录统计信息 */
const getSummary = async () => {
  recordSummary.value = await CombinationRecordApi.getCombinationRecordSummary()
}

// tabs 数据
const tabsData = ref([
  {
    count: 0,
    name: '全部',
    type: 'all',
    value: 0
  },
  {
    count: 0,
    name: '今天',
    type: 'toDay',
    value: 1
  },
  {
    count: 0,
    name: '昨天',
    type: 'yesterday',
    value: 2
  },
  {
    count: 0,
    name: '最近七天',
    type: 'lastSevenDays',
    value: 3
  },
  {
    count: 0,
    name: '最近30天',
    type: 'last30Days',
    value: 4
  },
  {
    count: 0,
    name: '本月',
    type: 'thisMonth',
    value: 5
  },
  {
    count: 0,
    name: '今年',
    type: 'thisYear',
    value: 6
  }
])

/** 获得每个 Tab 的数量 */
const getTabsCount = async () => {
  const res = await CombinationRecordApi.getCombinationRecordCount()
  tabsData.value.forEach((tab) => {
    tab.count = res[tab.type]
  })
}

const handleTabClick = async (tab: TabsPaneContext) => {
  queryParams.value.dateType = tab.paneName as number
  await getList()
}

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

/** 初始化 **/
onMounted(async () => {
  await getSummary()
  await getTabsCount()
  await getList()
})
</script>
