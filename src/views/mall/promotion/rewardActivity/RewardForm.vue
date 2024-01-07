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
        <template v-for="(item,index) in formData.rules" :key="index">
        <el-row type="flex">
          <el-col :span="24" style="font-weight: bold;display: flex;">活动层级{{ index+1 }}<el-button link type="danger" style="margin-left: auto;" v-if="index!=0" @click="deleteStratum(index)">删除</el-button></el-col>
            <e-form :ref="'formRef'+index" :model="item"  >
               <el-form-item  label="优惠门槛:" prop="limit" label-width="100px" style="padding-left: 50px;">满<el-input style="width: 150px;padding:0 10px;" v-model="item.limit" type='number' placeholder="" /> 元
               </el-form-item>
               <el-form-item label="优惠内容:"  label-width="100px"  style="padding-left: 50px;">
                <el-checkbox-group  v-model="rules[index]" style="width:100%">
                    <el-col :span="24">
                      <el-checkbox  label="订单金额优惠" name="type" />
                      <el-form-item v-if="rules[index].includes('订单金额优惠')">
                        减<el-input style="width: 150px;padding:0 20px;" v-model="item.discountPrice" type='number' placeholder="" />元
                     </el-form-item>
                    </el-col>
                    <el-col :span="24"><el-checkbox v-model="item.freeDelivery" label="包邮" name="type" /></el-col>
                    <el-col :span="24">
                      <el-checkbox label="送积分" name="type" />
                      <el-form-item v-if="rules[index].includes('送积分')">
                        送<el-input style="width: 150px;padding:0 20px;" v-model="item.point" type='number' placeholder="" />积分
                     </el-form-item>
                    </el-col>
                    <!-- 优惠券待处理  也可以参考优惠劵的SpuShowcase-->
                    <!-- TODO 待实现！-->
                    <el-col :span="24"><el-checkbox label="送优惠券" name="type" /></el-col>
                </el-checkbox-group>
              </el-form-item>
            </e-form>
        </el-row>
      </template>
        <el-button  type="primary" @click="addStratum">添加活动层级</el-button>
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
import * as RewardActivityApi from '@/api/mall/promotion/reward/rewardActivity'  
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
  rules: [{
    limit: undefined,
    discountPrice:  undefined,
    freeDelivery: undefined,
    point:  undefined,
    couponIds: [],
    couponCounts: []
  }],
})
// 优惠设置
let rules=reactive([]);
// 优惠券列表

const formRules = reactive({
  name: [{ required: true, message: '活动名称不能为空', trigger: 'blur' }],
  startAndEndTime: [{ required: true, message: '活动时间不能为空', trigger: 'blur' }],
  conditionType: [{ required: true, message: '条件类型不能为空', trigger: 'change' }],
  productScope: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }],
  productSpuIds: [{ required: true, message: '商品范围不能为空', trigger: 'blur' }]
})
const formRef = ref([]) // 表单 Ref

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
    let data= await RewardActivityApi.getReward(id);
    data.startAndEndTime=[new Date(data.startTime), new Date(data.endTime)];
    rules.splice(0,rules.length);
    data.rules.forEach((item)=>{
      let ars:string[]=reactive([]);
      if(item.freeDelivery){
        ars.push('包邮')
      }
      if(item.point){
        ars.push('送积分')
      }
      if(item.discountPrice){
        ars.push('订单金额优惠')
      }
      rules.push(ars)
    })
    formData.value=data
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
  // 处理下数据兼容接口
  formData.value.startTime= +new Date(formData.value.startAndEndTime[0])
  formData.value.endTime=+new Date(formData.value.startAndEndTime[1])
  console.log(rules)
  rules.forEach((item,index)=>{
      if(item.includes('包邮')){
        formData.value.rules[index].freeDelivery=true;
      }else{
        formData.value.rules[index].freeDelivery=false;
      }
      if(!item.includes('送积分')){
        formData.value.rules[index].point=undefined;
      }
      if(!item.includes('订单金额优惠')){
        formData.value.rules[index].discountPrice=undefined;
      }
  })

  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as RewardActivityApi.DiscountActivityVO
    if (formType.value === 'create') {
      await RewardActivityApi.createRewardActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await RewardActivityApi.updateRewardActivity(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const addStratum =()=>{
  formData.value.rules.push({
      limit: undefined,
      discountPrice:  undefined,
      freeDelivery: undefined,
      point:  undefined,
      couponIds: [],
      couponCounts: []
    })
    rules.push([]);
    console.log(rules)
}

const deleteStratum=(index)=>{
  formData.value.rules.splice(index,1)
  rules.splice(index,1)
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    startAndEndTime: undefined,
    startTime: undefined,
    endTime: undefined,
    conditionType: PromotionConditionTypeEnum.PRICE.type,
    remark: undefined,
    productScope: PromotionProductScopeEnum.ALL.scope,
    productSpuIds: undefined,
    rules: [{
      limit: undefined,
      discountPrice:  undefined,
      freeDelivery: undefined,
      point:  undefined,
      couponIds: [],
      couponCounts: []
    }],
  }
  rules.splice(0,rules.length);
  rules.push(reactive([]));
  // 解决下有时刷新页面第一次点编辑报错
 nextTick(()=>{
  formRef.value?.resetFields()
 })
}
</script>
