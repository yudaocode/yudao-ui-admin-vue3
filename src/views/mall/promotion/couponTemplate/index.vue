<template>
  <doc-alert title="功能开启" url="https://doc.iocoder.cn/mall/build/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      v-show="showSearch"
      label-width="82px"
    >
      <el-form-item label="优惠券名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入优惠劵名"
          clearable
          @keyup="handleQuery"
        />
      </el-form-item>
      <el-form-item label="优惠券类型" prop="discountType">
        <el-select v-model="queryParams.discountType" placeholder="请选择优惠券类型" clearable>
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优惠券状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择优惠券状态" clearable>
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
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          @click="handleAdd"
          v-hasPermi="['promotion:coupon-template:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" />新增
        </el-button>
        <el-button
          type="info"
          plain
          @click="$router.push('/promotion/coupon')"
          v-hasPermi="['promotion:coupon:query']"
        >
          <Icon icon="ep:operation" class="mr-5px" />会员优惠劵
        </el-button>
      </el-col>
      <!-- <right-toolbar v-model:showSearch="showSearch" @query-table="getList" /> -->
    </el-row>
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
        width="180"
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
            size="small"
            type="primary"
            link
            @click="handleUpdate(scope.row)"
            v-hasPermi="['promotion:coupon-template:update']"
          >
            <Icon icon="ep:edit" :size="12" class="mr-1px" />
            修改
          </el-button>
          <el-button
            size="small"
            type="primary"
            link
            @click="handleDelete(scope.row)"
            v-hasPermi="['promotion:coupon-template:delete']"
          >
            <Icon icon="ep:delete" :size="12" class="mr-1px" />
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 分页组件 -->
  <pagination
    v-show="total > 0"
    :total="total"
    v-model:page="queryParams.pageNo"
    v-model:limit="queryParams.pageSize"
    @pagination="getList"
  />

  <!-- 对话框(添加 / 修改) -->
  <el-dialog :title="title" v-model="open" width="600px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
      <el-form-item label="优惠券名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入优惠券名称" />
      </el-form-item>
      <el-form-item label="优惠券类型" prop="discountType">
        <el-radio-group v-model="form.discountType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.discountType === PromotionDiscountTypeEnum.PRICE.type"
        label="优惠券面额"
        prop="discountPrice"
      >
        <el-input-number
          v-model="form.discountPrice"
          placeholder="请输入优惠金额，单位：元"
          style="width: 400px"
          :precision="2"
          :min="0"
        />
        元
      </el-form-item>
      <el-form-item
        v-if="form.discountType === PromotionDiscountTypeEnum.PERCENT.type"
        label="优惠券折扣"
        prop="discountPercent"
      >
        <el-input-number
          v-model="form.discountPercent"
          placeholder="优惠券折扣不能小于 1 折，且不可大于 9.9 折"
          style="width: 400px"
          :precision="1"
          :min="1"
          :max="9.9"
        />
        折
      </el-form-item>
      <el-form-item
        v-if="form.discountType === PromotionDiscountTypeEnum.PERCENT.type"
        label="最多优惠"
        prop="discountLimitPrice"
      >
        <el-input-number
          v-model="form.discountLimitPrice"
          placeholder="请输入最多优惠"
          style="width: 400px"
          :precision="2"
          :min="0"
        />
        元
      </el-form-item>
      <el-form-item label="满多少元可以使用" prop="usePrice">
        <el-input-number
          v-model="form.usePrice"
          placeholder="无门槛请设为 0"
          style="width: 400px"
          :precision="2"
          :min="0"
        />
        元
      </el-form-item>
      <el-form-item label="领取方式" prop="takeType">
        <el-radio-group v-model="form.takeType">
          <el-radio :key="1" :label="1">直接领取</el-radio>
          <el-radio :key="2" :label="2">指定发放</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.takeType === 1" label="发放数量" prop="totalCount">
        <el-input-number
          v-model="form.totalCount"
          placeholder="发放数量，没有之后不能领取或发放，-1 为不限制"
          style="width: 400px"
          :precision="0"
          :min="-1"
        />
        张
      </el-form-item>
      <el-form-item v-if="form.takeType === 1" label="每人限领个数" prop="takeLimitCount">
        <el-input-number
          v-model="form.takeLimitCount"
          placeholder="设置为 -1 时，可无限领取"
          style="width: 400px"
          :precision="0"
          :min="-1"
        />
        张
      </el-form-item>
      <el-form-item label="有效期类型" prop="validityType">
        <el-radio-group v-model="form.validityType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.validityType === CouponTemplateValidityTypeEnum.DATE.type"
        label="固定日期"
        prop="validTimes"
      >
        <el-date-picker
          v-model="form.validTimes"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="datetimerange"
          :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)]"
        />
      </el-form-item>
      <el-form-item
        v-if="form.validityType === CouponTemplateValidityTypeEnum.TERM.type"
        label="领取日期"
        prop="fixedStartTerm"
      >
        第
        <el-input-number
          v-model="form.fixedStartTerm"
          placeholder="0 为今天生效"
          style="width: 165px"
          :precision="0"
          :min="0"
        />
        至
        <el-input-number
          v-model="form.fixedEndTerm"
          placeholder="请输入结束天数"
          style="width: 165px"
          :precision="0"
          :min="0"
        />
        天有效
      </el-form-item>
      <el-form-item label="活动商品" prop="productScope">
        <el-radio-group v-model="form.productScope">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_PRODUCT_SCOPE)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="form.productScope === PromotionProductScopeEnum.SPU.scope"
        prop="productSpuIds"
      >
        <el-select
          v-model="form.productSpuIds"
          placeholder="请选择活动商品"
          clearable
          size="small"
          multiple
          filterable
          style="width: 400px"
        >
          <el-option v-for="item in productSpus" :key="item.id" :label="item.name" :value="item.id">
            <span style="float: left">{{ item.name }}</span>
            <span style="float: right; color: #8492a6; font-size: 13px"
              >￥{{ (item.minPrice / 100.0).toFixed(2) }}</span
            >
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="PromotionCouponTemplate">
import {
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  getCouponTemplate,
  getCouponTemplatePage,
  updateCouponTemplateStatus
} from '@/api/mall/promotion/couponTemplate'
import {
  CommonStatusEnum,
  CouponTemplateValidityTypeEnum,
  PromotionDiscountTypeEnum,
  PromotionProductScopeEnum
} from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { getSpuSimpleList } from '@/api/mall/product/spu'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { FormInstance } from 'element-plus'

// 消息弹窗
const message = useMessage()

// 遮罩层
const loading = ref(true)
// 显示搜索条件
const showSearch = ref(true)
// 总条数
const total = ref(0)
// 优惠劵列表
const list = ref([])
// 弹出层标题
const title = ref('')
// 是否显示弹出层
const open = ref(false)
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: null,
  status: null,
  type: null,
  createTime: []
})
// 表单参数
const form = ref<any>({})
// 表单校验
const rules = {
  name: [{ required: true, message: '优惠券名称不能为空', trigger: 'blur' }],
  discountType: [{ required: true, message: '优惠券类型不能为空', trigger: 'change' }],
  discountPrice: [{ required: true, message: '优惠券面额不能为空', trigger: 'blur' }],
  discountPercent: [{ required: true, message: '优惠券折扣不能为空', trigger: 'blur' }],
  discountLimitPrice: [{ required: true, message: '最多优惠不能为空', trigger: 'blur' }],
  usePrice: [{ required: true, message: '满多少元可以使用不能为空', trigger: 'blur' }],
  takeType: [{ required: true, message: '领取方式不能为空', trigger: 'change' }],
  totalCount: [{ required: true, message: '发放数量不能为空', trigger: 'blur' }],
  takeLimitCount: [{ required: true, message: '每人限领个数不能为空', trigger: 'blur' }],
  validityType: [{ required: true, message: '有效期类型不能为空', trigger: 'change' }],
  validTimes: [{ required: true, message: '固定日期不能为空', trigger: 'change' }],
  fixedStartTerm: [{ required: true, message: '开始领取天数不能为空', trigger: 'blur' }],
  fixedEndTerm: [{ required: true, message: '开始领取天数不能为空', trigger: 'blur' }],
  productScope: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }],
  productSpuIds: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }]
}
// 商品列表
const productSpus = ref([])
const queryFormRef = ref<FormInstance | null>(null)
const formRef = ref<FormInstance | null>(null)

onMounted(() => {
  getList()
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 执行查询
    const data = await getCouponTemplatePage(queryParams)
    list.value = data.list
    total.value = data.total
    // 查询商品列表
    productSpus.value = await getSpuSimpleList()
  } finally {
    loading.value = false
  }
}

/** 取消按钮 */
const cancel = () => {
  open.value = false
  reset()
}

/** 表单重置 */
const reset = () => {
  form.value = {
    id: undefined,
    name: undefined,
    discountType: PromotionDiscountTypeEnum.PRICE.type,
    discountPrice: undefined,
    discountPercent: undefined,
    discountLimitPrice: undefined,
    usePrice: undefined,
    takeType: 1,
    totalCount: undefined,
    takeLimitCount: undefined,
    validityType: CouponTemplateValidityTypeEnum.DATE.type,
    validTimes: [],
    validStartTime: undefined,
    validEndTime: undefined,
    fixedStartTerm: undefined,
    fixedEndTerm: undefined,
    productScope: PromotionProductScopeEnum.ALL.scope,
    productSpuIds: []
  }
  formRef.value?.resetFields()
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

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = '添加优惠劵'
}

/** 修改按钮操作 */
const handleUpdate = async (row: any) => {
  reset()
  const id = row.id
  try {
    const data = await getCouponTemplate(id)
    form.value = {
      ...data,
      discountPrice: data.discountPrice !== undefined ? data.discountPrice / 100.0 : undefined,
      discountPercent: data.discountPercent !== undefined ? data.discountPercent / 10.0 : undefined,
      discountLimitPrice:
        data.discountLimitPrice !== undefined ? data.discountLimitPrice / 100.0 : undefined,
      usePrice: data.usePrice !== undefined ? data.usePrice / 100.0 : undefined,
      validTimes: [data.validStartTime, data.validEndTime]
    }
    open.value = true
    title.value = '修改优惠劵'
  } catch {}
}

/** 提交按钮 */
const submitForm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }

  // 金额相关字段的缩放
  let data = {
    ...form.value,
    discountPrice:
      form.value.discountPrice !== undefined ? form.value.discountPrice * 100 : undefined,
    discountPercent:
      form.value.discountPercent !== undefined ? form.value.discountPercent * 10 : undefined,
    discountLimitPrice:
      form.value.discountLimitPrice !== undefined ? form.value.discountLimitPrice * 100 : undefined,
    usePrice: form.value.usePrice !== undefined ? form.value.usePrice * 100 : undefined,
    validStartTime:
      form.value.validTimes && form.value.validTimes.length === 2
        ? form.value.validTimes[0]
        : undefined,
    validEndTime:
      form.value.validTimes && form.value.validTimes.length === 2
        ? form.value.validTimes[1]
        : undefined
  }

  // 修改的提交
  if (form.value.id != null) {
    try {
      await updateCouponTemplate(data)
      message.success('修改成功')
      open.value = false
      getList()
    } catch {}

    return
  }

  try {
    await createCouponTemplate(data)
    message.success('新增成功')
    open.value = false
    getList()
  } catch {}
}

/** 优惠劵模板状态修改 */
const handleStatusChange = async (row: any) => {
  // 此时，row 已经变成目标状态了，所以可以直接提交请求和提示
  let text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'

  try {
    await message.confirm('确认要"' + text + '""' + row.name + '"优惠劵吗?')
    await updateCouponTemplateStatus(row.id, row.status)
    message.success(text + '成功')
  } catch {
    // 异常时，需要将 row.status 状态重置回之前的
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 删除按钮操作 */
const handleDelete = async (row: any) => {
  const id = row.id
  try {
    await message.confirm('是否确认删除优惠劵编号为"' + id + '"的数据项?')
    await deleteCouponTemplate(id)
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
</script>
