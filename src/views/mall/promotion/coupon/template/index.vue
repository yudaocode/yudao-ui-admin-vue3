<template>
  <doc-alert title="功能开启" url="https://doc.iocoder.cn/mall/build/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
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
      <el-form-item label="优惠券类型" prop="discountType">
        <el-select
          v-model="queryParams.discountType"
          class="!w-240px"
          placeholder="请选择优惠券类型"
          clearable
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优惠券状态" prop="status">
        <el-select
          v-model="queryParams.status"
          class="!w-240px"
          placeholder="请选择优惠券状态"
          clearable
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
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
        <el-button @click="handleQuery"> <Icon icon="ep:search" class="mr-5px" />搜索 </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" />重置 </el-button>
        <el-button
          v-hasPermi="['promotion:coupon-template:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" /> 新增
        </el-button>
        <el-button
          plain
          type="success"
          @click="$router.push('/promotion/coupon')"
          v-hasPermi="['promotion:coupon:query']"
        >
          <Icon icon="ep:operation" class="mr-5px" />会员优惠劵
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="优惠券名称" align="center" prop="name" />
      <el-table-column label="优惠券类型" align="center" prop="discountType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="scope.row.discountType" />
        </template>
      </el-table-column>
      <el-table-column
        label="优惠金额 / 折扣"
        align="center"
        prop="discount"
        :formatter="discountFormat"
      />
      <el-table-column label="发放数量" align="center" prop="totalCount" />
      <el-table-column
        label="剩余数量"
        align="center"
        prop="totalCount"
        :formatter="(row) => row.totalCount - row.takeCount"
      />
      <el-table-column
        label="领取上限"
        align="center"
        prop="takeLimitCount"
        :formatter="takeLimitCountFormat"
      />
      <el-table-column
        label="有效期限"
        align="center"
        prop="validityType"
        width="190"
        :formatter="validityTypeFormat"
      />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            v-hasPermi="['promotion:coupon-template:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            修改
          </el-button>
          <el-button
            v-hasPermi="['promotion:coupon-template:delete']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
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
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <CouponTemplateForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import {
  CommonStatusEnum,
  CouponTemplateValidityTypeEnum,
  PromotionDiscountTypeEnum
} from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import CouponTemplateForm from './CouponTemplateForm.vue'

defineOptions({ name: 'PromotionCouponTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 字典表格数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  status: null,
  type: null,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 执行查询
    const data = await CouponTemplateApi.getCouponTemplatePage(queryParams)
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
  queryFormRef?.value?.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 优惠劵模板状态修改 */
const handleStatusChange = async (row: any) => {
  // 此时，row 已经变成目标状态了，所以可以直接提交请求和提示
  let text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'

  try {
    await message.confirm('确认要"' + text + '""' + row.name + '"优惠劵吗?')
    await CouponTemplateApi.updateCouponTemplateStatus(row.id, row.status)
    message.success(text + '成功')
  } catch {
    // 异常时，需要将 row.status 状态重置回之前的
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.confirm('是否确认删除优惠劵编号为"' + id + '"的数据项?')
    // 发起删除
    await CouponTemplateApi.deleteCouponTemplate(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

// 格式化【优惠金额/折扣】
const discountFormat = (row: any) => {
  if (row.discountType === PromotionDiscountTypeEnum.PRICE.type) {
    return `￥${(row.discountPrice / 100.0).toFixed(2)}`
  }
  if (row.discountType === PromotionDiscountTypeEnum.PERCENT.type) {
    return `￥${(row.discountPrice / 100.0).toFixed(2)}`
  }
  return '未知【' + row.discountType + '】'
}

// 格式化【领取上限】
const takeLimitCountFormat = (row: any) => {
  if (row.takeLimitCount === -1) {
    return '无领取限制'
  }
  return `${row.takeLimitCount} 张/人`
}

// 格式化【有效期限】
const validityTypeFormat = (row: any) => {
  if (row.validityType === CouponTemplateValidityTypeEnum.DATE.type) {
    return `${formatDate(row.validStartTime)} 至 ${formatDate(row.validEndTime)}`
  }
  if (row.validityType === CouponTemplateValidityTypeEnum.TERM.type) {
    return `领取后第 ${row.fixedStartTerm} - ${row.fixedEndTerm} 天内可用`
  }
  return '未知【' + row.validityType + '】'
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
