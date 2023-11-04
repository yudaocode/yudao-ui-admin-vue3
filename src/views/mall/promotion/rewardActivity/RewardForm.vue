<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="活动名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入活动名称" />
      </el-form-item>
      <el-form-item label="活动时间" prop="startAndEndTime">
        <el-date-picker
          v-model="formData.startAndEndTime"
          type="datetimerange"
          range-separator="-"
          :start-placeholder="t('common.startTimeText')"
          :end-placeholder="t('common.endTimeText')"
        />
      </el-form-item>
      <el-form-item label="条件类型" prop="conditionType">
        <el-radio-group v-model="formData.conditionType">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_CONDITION_TYPE)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item label="优惠设置">
        <!-- TODO 待实现！这个实现下哈 -->
      </el-form-item>
      <el-form-item label="活动商品" prop="productScope">
        <el-radio-group v-model="formData.productScope">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.PROMOTION_PRODUCT_SCOPE)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <!-- TODO：活动商品的开发，可以参考优惠劵的，已经搞好啦； -->
      <el-form-item
        v-if="formData.productScope === PromotionProductScopeEnum.SPU.scope"
        prop="productSpuIds"
      >
        <el-select
          v-model="formData.productSpuIds"
          placeholder="请选择活动商品"
          clearable
          size="small"
          multiple
          filterable
          style="width: 400px"
        >
          <el-option v-for="item in productSpus" :key="item.id" :label="item.name" :value="item.id">
            <span style="float: left">{{ item.name }}</span>
            <span style="float: right; font-size: 13px; color: #8492a6"
              >￥{{ (item.price / 100.0).toFixed(2) }}</span
            >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { getSpuSimpleList } from '@/api/mall/product/spu'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as ProductBrandApi from '@/api/mall/product/brand'
import {
  PromotionConditionTypeEnum,
  PromotionProductScopeEnum,
  PromotionActivityStatusEnum
} from '@/utils/constants'
// 商品数据
const productSpus = ref<any[]>([])

/** 初始化 **/
onMounted(() => {
  getSpuSimpleList().then((response) => {
    productSpus.value = response
  })
})
defineOptions({ name: 'ProductBrandForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  startAndEndTime: undefined,
  startTime: undefined,
  endTime: undefined,
  conditionType: PromotionConditionTypeEnum.PRICE.type,
  remark: undefined,
  productScope: PromotionProductScopeEnum.ALL.scope,
  productSpuIds: undefined,
  rules: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '活动名称不能为空', trigger: 'blur' }],
  startAndEndTime: [{ required: true, message: '活动时间不能为空', trigger: 'blur' }],
  conditionType: [{ required: true, message: '条件类型不能为空', trigger: 'change' }],
  productScope: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }],
  productSpuIds: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      // formData.value = await ProductBrandApi.getBrand(id)
      formData.value = {
        conditionType: 10,
        description: '',
        id: undefined,
        name: '测试活动',
        picUrl: '',
        productScope: 2,
        productSpuIds: [634],
        remark: '测试备注',
        startAndEndTime: [new Date(), new Date('2023-12-31')],
        status: 0
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  console.log(formData.value)
  message.success('已在控制台打印数据')
  return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ProductBrandApi.BrandVO
    if (formType.value === 'create') {
      await ProductBrandApi.createBrand(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductBrandApi.updateBrand(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    picUrl: '',
    status: CommonStatusEnum.ENABLE,
    description: ''
  }
  formRef.value?.resetFields()
}
</script>
