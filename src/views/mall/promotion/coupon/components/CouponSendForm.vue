<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" title="发送优惠券" width="70%">
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="82px"
    >
      <el-form-item label="优惠券名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          placeholder="请输入优惠劵名"
          clearable
          @keyup="handleQuery"
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

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" show-overflow-tooltip>
      <el-table-column align="center" label="优惠券名称" prop="name" min-width="60" />
      <el-table-column
        label="优惠金额 / 折扣"
        align="center"
        prop="discount"
        :formatter="discountFormat"
        min-width="60"
      />
      <el-table-column
        align="center"
        label="最低消费"
        prop="usePrice"
        min-width="60"
        :formatter="usePriceFormat"
      />
      <el-table-column
        align="center"
        label="有效期限"
        prop="validityType"
        min-width="140"
        :formatter="validityTypeFormat"
      />
      <el-table-column
        align="center"
        label="剩余数量"
        min-width="60"
        :formatter="remainedCountFormat"
      />
      <el-table-column label="操作" align="center" min-width="60px" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            :disabled="sendLoading"
            :loading="sendLoading"
            @click="handleSendCoupon(scope.row.id)"
            v-hasPermi="['promotion:coupon:send']"
          >
            发送
          </el-button>
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
    <div class="clear-both"></div>
  </Dialog>
</template>
<script lang="ts" setup>
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import * as CouponApi from '@/api/mall/promotion/coupon/coupon'
import {
  discountFormat,
  remainedCountFormat,
  usePriceFormat,
  validityTypeFormat
} from '@/views/mall/promotion/coupon/formatter'
import { CouponTemplateTakeTypeEnum } from '@/utils/constants'

defineOptions({ name: 'PromotionCouponSendForm' })

const message = useMessage() // 消息弹窗
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据
const loading = ref(false) // 列表的加载中
const sendLoading = ref(false) // 发送按钮的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  name: null,
  canTakeTypes: [CouponTemplateTakeTypeEnum.ADMIN.type]
}) // 查询参数
const queryFormRef = ref() // 搜索的表单
// 领取人的编号列表
let userIds: number[] = []

/** 打开弹窗 */
const open = (ids: number[]) => {
  userIds = ids
  // 打开时重置查询，防止发送列表剩余数量未更新的问题
  resetQuery()

  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CouponTemplateApi.getCouponTemplatePage(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef?.value?.resetFields()
  handleQuery()
}

/** 发送操作 **/
const handleSendCoupon = async (templateId: number) => {
  try {
    sendLoading.value = true
    await CouponApi.sendCoupon({ templateId, userIds })
    // 提示
    message.success('发送成功')
    dialogVisible.value = false
  } finally {
    sendLoading.value = false
  }
}
</script>
