<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="65%">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      class="mt-10px"
      label-width="auto"
      @submit.prevent
    >
      <el-row :gutter="20" class="!mx-0">
        <el-col :span="24">
          <el-form-item label="拼团名称" prop="name">
            <el-input
              v-model="formData.name"
              clearable
              :placeholder="t('common.inputText') + '拼团名称'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item label="活动开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              class="!w-full"
              clearable
              :placeholder="t('common.selectText') + '活动开始时间'"
              type="date"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item label="活动结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              class="!w-full"
              clearable
              :placeholder="t('common.selectText') + '活动结束时间'"
              type="date"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item prop="userSize">
            <template #label>
              <span>参与人数</span>
              <el-tooltip content="参与人数不能少于两人" placement="right">
                <Icon
                  :size="16"
                  class="relative top-1px ml-2px"
                  color="var(--el-color-primary)"
                  icon="ep:warning"
                />
              </el-tooltip>
            </template>
            <el-input-number
              v-model="formData.userSize"
              class="!w-full"
              :placeholder="t('common.inputText') + '参与人数'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item prop="limitDuration">
            <template #label>
              <span>限制时长</span>
              <el-tooltip content="限制时长(小时)" placement="right">
                <Icon
                  :size="16"
                  class="relative top-1px ml-2px"
                  color="var(--el-color-primary)"
                  icon="ep:warning"
                />
              </el-tooltip>
            </template>
            <el-input-number
              v-model="formData.limitDuration"
              class="!w-full"
              placeholder="请输入限制时长(小时)"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item label="总限购数量" prop="totalLimitCount">
            <el-input-number
              v-model="formData.totalLimitCount"
              class="!w-full"
              :placeholder="t('common.inputText') + '总限购数量'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item label="单次限购数量" prop="singleLimitCount">
            <el-input-number
              v-model="formData.singleLimitCount"
              class="!w-full"
              :placeholder="t('common.inputText') + '单次限购数量'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item label="虚拟成团" prop="virtualGroup">
            <el-radio-group v-model="formData.virtualGroup">
              <el-radio
                v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                :key="String(dict.value)"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="拼团商品" prop="spuId">
            <el-button :disabled="formLoading" @click="spuSelectRef.open()">选择商品</el-button>
            <SpuAndSkuList
              ref="spuAndSkuListRef"
              :rule-config="ruleConfig"
              :spu-list="spuList"
              :spu-property-list-p="spuPropertyList"
            >
              <el-table-column align="center" label="拼团价格(元)" min-width="168">
                <template #default="{ row: sku }">
                  <el-input-number
                    v-model="sku.productConfig.combinationPrice"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="w-100%"
                  />
                </template>
              </el-table-column>
            </SpuAndSkuList>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <SpuSelect ref="spuSelectRef" :isSelectSku="true" @confirm="selectSpu" />
</template>
<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as CombinationActivityApi from '@/api/mall/promotion/combination/combinationActivity'
import { CombinationProductVO } from '@/api/mall/promotion/combination/combinationActivity'
import { DICT_TYPE, getBoolDictOptions } from '@/utils/dict'
import { SpuAndSkuList, SpuProperty, SpuSelect } from '@/views/mall/promotion/components'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { convertToInteger, formatToFraction } from '@/utils'
import { cloneDeep } from 'lodash-es'

defineOptions({ name: 'PromotionCombinationActivityForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref<FormInstance>() // 表单 Ref

// 半宽表单项的栅格：小屏整行，其余半行
const colProps = { xs: 24, sm: 12, md: 12, lg: 12, xl: 12 }

/** 表单初始数据：新增与每次打开时重置使用 */
const createFormData = (): Recordable => ({
  name: '',
  startTime: '',
  endTime: '',
  userSize: 2,
  limitDuration: 0,
  totalLimitCount: 0,
  singleLimitCount: 0,
  virtualGroup: false,
  spuId: ''
})
const formData = ref<Recordable>(createFormData())
// 表单校验
const rules = reactive<FormRules>({
  name: [required],
  totalLimitCount: [required],
  singleLimitCount: [required],
  startTime: [required],
  endTime: [required],
  userSize: [required],
  limitDuration: [required],
  virtualGroup: [required]
})

// ================= 商品选择相关 =================

const spuSelectRef = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 秒杀配置组件Ref
const spuList = ref<CombinationActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<CombinationActivityApi.SpuExtension>[]>([])
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.combinationPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品拼团价格不能小于0.01 ！！！'
  }
]
const selectSpu = async (spuId: number, skuIds: number[]) => {
  // 加载或保存期间不处理新的选择；商品详情加载完成前保持加载，不可提交
  if (formLoading.value) return
  formLoading.value = true
  try {
    await getSpuDetails(spuId, skuIds)
  } finally {
    formLoading.value = false
  }
}
/**
 * 获取 SPU 详情
 */
const getSpuDetails = async (
  spuId: number,
  skuIds: number[] | undefined,
  products?: CombinationProductVO[]
) => {
  const spuProperties: SpuProperty<CombinationActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList([
    spuId
  ])) as CombinationActivityApi.SpuExtension[]
  if (res.length == 0) {
    return
  }
  // 商品编号与商品详情一起写入，保持一致
  formData.value.spuId = spuId
  spuList.value = []
  // 因为只能选择一个
  const spu = res[0]
  const selectSkus =
    typeof skuIds === 'undefined' ? spu?.skus : spu?.skus?.filter((sku) => skuIds.includes(sku.id!))
  selectSkus?.forEach((sku) => {
    let config: CombinationProductVO = {
      spuId: spu.id!,
      skuId: sku.id!,
      combinationPrice: 0
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      if (product) {
        product.combinationPrice = Number(formatToFraction(product.combinationPrice))
      }
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as CombinationActivityApi.SkuExtension[]
  spuProperties.push({
    spuId: spu.id!,
    spuDetail: spu,
    propertyList: getPropertyList(spu)
  })
  spuList.value.push(spu)
  spuPropertyList.value = spuProperties
}

// ================= end =================

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  // 上一次的加载或保存未结束时不重新打开，避免旧请求的结果写入新表单
  if (formLoading.value) return
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  await resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = (await CombinationActivityApi.getCombinationActivity(
        id
      )) as CombinationActivityApi.CombinationActivityVO
      await getSpuDetails(
        data.spuId!,
        data.products?.map((sku) => sku.skuId),
        data.products
      )
      // 合并接口返回的全部字段（与原表单 setValues 一致：隔离接口对象）
      Object.assign(formData.value, cloneDeep(data))
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 重置表单 */
const resetForm = async () => {
  spuList.value = []
  spuPropertyList.value = []
  // 每次打开使用全新的初始数据，不带上一次编辑对象的字段（如 id）
  formData.value = createFormData()
  await nextTick()
  formRef.value?.resetFields()
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  if (!formRef.value || formLoading.value) return
  // 校验与提交期间保持加载，不可重复提交、选择商品或重新打开
  formLoading.value = true
  try {
    // 校验表单
    const valid = await formRef.value.validate()
    // 校验期间已关闭弹窗：不再提交
    if (!valid || !dialogVisible.value) return
    if (spuList.value.length === 0) {
      message.warning('请选择商品')
      return
    }
    // 获得拼团商品配置
    const products = cloneDeep(spuAndSkuListRef.value.getSkuConfigs('productConfig'))
    products.forEach((item: CombinationActivityApi.CombinationProductVO) => {
      item.combinationPrice = convertToInteger(item.combinationPrice)
    })
    const data = cloneDeep(formData.value) as CombinationActivityApi.CombinationActivityVO
    data.products = products
    // 真正提交
    if (formType.value === 'create') {
      await CombinationActivityApi.createCombinationActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await CombinationActivityApi.updateCombinationActivity(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
