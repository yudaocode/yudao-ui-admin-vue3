<template>
  <doc-alert title="功能开启" url="https://doc.iocoder.cn/mall/build/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="会员昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入会员昵称"
          clearable
          @keyup="handleQuery"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          style="width: 240px"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)]"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" />重置 </el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <!-- <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row> -->
  </ContentWrap>

  <ContentWrap>
    <!-- Tab 选项：真正的内容在 Lab -->
    <el-tabs v-model="activeTab" type="card" @tab-change="onTabChange">
      <el-tab-pane
        v-for="tab in statusTabs"
        :key="tab.value"
        :label="tab.label"
        :name="tab.value"
      />
    </el-tabs>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="会员信息" align="center" prop="nickname" />
      <!-- TODO 芋艿：以后支持头像，支持跳转 -->
      <el-table-column label="优惠劵" align="center" prop="name" />
      <el-table-column label="优惠券类型" align="center" prop="discountType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="scope.row.discountType" />
        </template>
      </el-table-column>
      <el-table-column label="领取方式" align="center" prop="takeType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE" :value="scope.row.takeType" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROMOTION_COUPON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="领取时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column
        label="使用时间"
        align="center"
        prop="useTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            link
            @click="handleDelete(scope.row)"
            v-hasPermi="['promotion:coupon:delete']"
            ><Icon icon="ep:delete" :size="12" class="mr-1px" />回收</el-button
          >
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
</template>

<script setup lang="ts" name="PromotionCoupon">
import { deleteCoupon, getCouponPage } from '@/api/mall/promotion/coupon'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { FormInstance } from 'element-plus'

// 消息弹窗
const message = useMessage()

// 遮罩层
const loading = ref(true)
// 总条数
const total = ref(0)
// 优惠劵列表
const list = ref([])
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  createTime: [],
  status: undefined
})
// Tab 筛选
const activeTab = ref('all')

const statusTabs = reactive([
  {
    label: '全部',
    value: 'all'
  }
])

const queryFormRef = ref<FormInstance | null>(null)

/** 查询列表 */
const getList = async () => {
  loading.value = true
  // 执行查询
  try {
    const data = await getCouponPage(queryParams)
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

/** 删除按钮操作 */
const handleDelete = async (row) => {
  const id = row.id

  try {
    await message.confirm(
      '回收将会收回会员领取的待使用的优惠券，已使用的将无法回收，确定要回收所选优惠券吗？'
    )
    await deleteCoupon(id)
    getList()
    message.notifySuccess('回收成功')
  } catch {}
}

/** tab 切换 */
const onTabChange = (tabName) => {
  queryParams.status = tabName === 'all' ? undefined : tabName
  getList()
}

onMounted(() => {
  getList()
  // 设置 statuses 过滤
  for (const dict of getIntDictOptions(DICT_TYPE.PROMOTION_COUPON_STATUS)) {
    statusTabs.push({
      label: dict.label,
      value: dict.value as string
    })
  }
})
</script>
