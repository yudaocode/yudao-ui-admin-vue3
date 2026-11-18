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
          <el-form-item label="砍价活动名称" prop="name">
            <el-input
              v-model="formData.name"
              clearable
              :placeholder="t('common.inputText') + '砍价活动名称'"
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
          <el-form-item prop="helpMaxCount">
            <template #label>
              <span>砍价人数</span>
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
              v-model="formData.helpMaxCount"
              class="!w-full"
              :placeholder="t('common.inputText') + '砍价人数'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item prop="bargainCount">
            <template #label>
              <span>最大帮砍次数</span>
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
              v-model="formData.bargainCount"
              class="!w-full"
              :placeholder="t('common.inputText') + '最大帮砍次数'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item prop="totalLimitCount">
            <template #label>
              <span>总限购数量</span>
              <el-tooltip content="用户最大能发起砍价的次数" placement="right">
                <Icon
                  :size="16"
                  class="relative top-1px ml-2px"
                  color="var(--el-color-primary)"
                  icon="ep:warning"
                />
              </el-tooltip>
            </template>
            <el-input-number
              v-model="formData.totalLimitCount"
              class="!w-full"
              :placeholder="t('common.inputText') + '总限购数量'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item prop="randomMinPrice">
            <template #label>
              <span>砍价的最小金额</span>
              <el-tooltip content="用户每次砍价的最小金额" placement="right">
                <Icon
                  :size="16"
                  class="relative top-1px ml-2px"
                  color="var(--el-color-primary)"
                  icon="ep:warning"
                />
              </el-tooltip>
            </template>
            <el-input-number
              v-model="formData.randomMinPrice"
              :min="0"
              :precision="2"
              :step="0.1"
              class="!w-full"
              :placeholder="t('common.inputText') + '砍价的最小金额'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item prop="randomMaxPrice">
            <template #label>
              <span>砍价的最大金额</span>
              <el-tooltip content="用户每次砍价的最大金额" placement="right">
                <Icon
                  :size="16"
                  class="relative top-1px ml-2px"
                  color="var(--el-color-primary)"
                  icon="ep:warning"
                />
              </el-tooltip>
            </template>
            <el-input-number
              v-model="formData.randomMaxPrice"
              :min="0"
              :precision="2"
              :step="0.1"
              class="!w-full"
              :placeholder="t('common.inputText') + '砍价的最大金额'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="砍价商品" prop="spuId">
            <el-button :disabled="formLoading" @click="spuSelectRef.open()">选择商品</el-button>
            <SpuAndSkuList
              ref="spuAndSkuListRef"
              :rule-config="ruleConfig"
              :spu-list="spuList"
              :spu-property-list-p="spuPropertyList"
            >
              <el-table-column align="center" label="砍价起始价格(元)" min-width="168">
                <template #default="{ row: sku }">
                  <el-input-number
                    v-model="sku.productConfig.bargainFirstPrice"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="w-100%"
                  />
                </template>
              </el-table-column>
              <el-table-column align="center" label="砍价底价(元)" min-width="168">
                <template #default="{ row: sku }">
                  <el-input-number
                    v-model="sku.productConfig.bargainMinPrice"
                    :min="0"
                    :precision="2"
                    :step="0.1"
                    class="w-100%"
                  />
                </template>
              </el-table-column>
              <el-table-column align="center" label="活动库存" min-width="168">
                <template #default="{ row: sku }">
                  <el-input-number v-model="sku.productConfig.stock" class="w-100%" />
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
  <SpuSelect ref="spuSelectRef" :isSelectSku="true" :radio="true" @confirm="selectSpu" />
</template>
<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import * as BargainActivityApi from '@/api/mall/promotion/bargain/bargainActivity'
import { BargainProductVO } from '@/api/mall/promotion/bargain/bargainActivity'
import { SpuAndSkuList, SpuProperty, SpuSelect } from '@/views/mall/promotion/components'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { convertToInteger, formatToFraction } from '@/utils'
import { cloneDeep } from 'lodash-es'

defineOptions({ name: 'PromotionBargainActivityForm' })

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
  helpMaxCount: 2,
  bargainCount: 2,
  totalLimitCount: 0,
  randomMinPrice: 0,
  randomMaxPrice: 0,
  spuId: ''
})
const formData = ref<Recordable>(createFormData())
// 表单校验
const rules = reactive<FormRules>({
  name: [required],
  startTime: [required],
  endTime: [required],
  helpMaxCount: [required],
  bargainCount: [required],
  totalLimitCount: [required],
  randomMinPrice: [required],
  randomMaxPrice: [required]
})

// ================= 商品选择相关 =================

const spuSelectRef = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 秒杀配置组件Ref
const spuList = ref<BargainActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<BargainActivityApi.SpuExtension>[]>([])
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.bargainFirstPrice',
    rule: (arg) => arg > 0,
    message: '商品砍价起始价格不能小于 0 ！！！'
  },
  {
    name: 'productConfig.bargainMinPrice',
    rule: (arg) => arg >= 0,
    message: '商品砍价底价不能小于 0 ！！！'
  },
  {
    name: 'productConfig.stock',
    rule: (arg) => arg >= 1,
    message: '商品活动库存不能小于 1 ！！！'
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
  products?: BargainProductVO[]
) => {
  const spuProperties: SpuProperty<BargainActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList([spuId])) as BargainActivityApi.SpuExtension[]
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
    let config: BargainProductVO = {
      spuId: spu.id!,
      skuId: sku.id!,
      bargainFirstPrice: 1,
      bargainMinPrice: 1,
      stock: 1
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      if (product) {
        product.bargainFirstPrice = Number(formatToFraction(product.bargainFirstPrice))
        product.bargainMinPrice = Number(formatToFraction(product.bargainMinPrice))
      }
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as BargainActivityApi.SkuExtension[]
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
      const data = (await BargainActivityApi.getBargainActivity(
        id
      )) as BargainActivityApi.BargainActivityVO
      // 用户每次砍价金额分转元, 分转元
      data.randomMinPrice = Number(formatToFraction(data.randomMinPrice))
      data.randomMaxPrice = Number(formatToFraction(data.randomMaxPrice))
      // 对齐活动商品处理结构
      await getSpuDetails(
        data.spuId!,
        [data.skuId],
        [
          {
            spuId: data.spuId!,
            skuId: data.skuId,
            bargainFirstPrice: data.bargainFirstPrice, // 砍价起始价格，单位分
            bargainMinPrice: data.bargainMinPrice, // 砍价底价
            stock: data.stock // 活动库存
          }
        ]
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
    const data = cloneDeep(formData.value) as BargainActivityApi.BargainActivityVO
    const products = cloneDeep(spuAndSkuListRef.value.getSkuConfigs('productConfig'))
    products.forEach((item: BargainProductVO) => {
      // 砍价价格元转分
      item.bargainFirstPrice = convertToInteger(item.bargainFirstPrice)
      item.bargainMinPrice = convertToInteger(item.bargainMinPrice)
    })
    // 用户每次砍价金额分转元, 元转分
    data.randomMinPrice = convertToInteger(data.randomMinPrice)
    data.randomMaxPrice = convertToInteger(data.randomMaxPrice)
    const payload = { ...data, ...products[0] }
    if (formType.value === 'create') {
      await BargainActivityApi.createBargainActivity(payload)
      message.success(t('common.createSuccess'))
    } else {
      await BargainActivityApi.updateBargainActivity(payload)
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
