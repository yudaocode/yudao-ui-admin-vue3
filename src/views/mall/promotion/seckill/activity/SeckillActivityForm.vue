<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="65%">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      label-width="auto"
      @submit.prevent
    >
      <el-row :gutter="20" class="!mx-0">
        <el-col :span="24">
          <el-form-item label="秒杀活动名称" prop="name">
            <el-input
              v-model="formData.name"
              clearable
              :placeholder="t('common.inputText') + '秒杀活动名称'"
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
          <el-form-item label="秒杀时段" prop="configIds">
            <el-select
              v-model="formData.configIds"
              class="!w-full"
              clearable
              multiple
              :placeholder="t('common.selectText') + '秒杀时段'"
            >
              <el-option
                v-for="item in seckillConfigList"
                :key="item.id"
                v-bind="omit(item, ['label', 'value'])"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
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
          <el-form-item label="单次限够数量" prop="singleLimitCount">
            <el-input-number
              v-model="formData.singleLimitCount"
              class="!w-full"
              :placeholder="t('common.inputText') + '单次限够数量'"
            />
          </el-form-item>
        </el-col>
        <el-col v-bind="colProps">
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              class="!w-full"
              :placeholder="t('common.inputText') + '排序'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="秒杀活动商品" prop="spuId">
            <!-- 先选择 -->
            <el-button :disabled="formLoading" @click="spuSelectRef.open()">选择商品</el-button>
            <SpuAndSkuList
              ref="spuAndSkuListRef"
              :rule-config="ruleConfig"
              :spu-list="spuList"
              :spu-property-list-p="spuPropertyList"
            >
              <el-table-column align="center" label="秒杀库存" min-width="168">
                <template #default="{ row: sku }">
                  <el-input-number v-model="sku.productConfig.stock" :min="0" class="w-100%" />
                </template>
              </el-table-column>
              <el-table-column align="center" label="秒杀价格(元)" min-width="168">
                <template #default="{ row: sku }">
                  <el-input-number
                    v-model="sku.productConfig.seckillPrice"
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
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              :rows="4"
              clearable
              :placeholder="t('common.inputText') + '备注'"
              type="textarea"
            />
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
import { SpuAndSkuList, SpuProperty, SpuSelect } from '../../components'
import { cloneDeep, omit } from 'lodash-es'

import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'
import { SeckillProductVO } from '@/api/mall/promotion/seckill/seckillActivity'
import { SeckillConfigApi, SeckillConfigVO } from '@/api/mall/promotion/seckill/seckillConfig'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'
import { convertToInteger, formatToFraction } from '@/utils'

defineOptions({ name: 'PromotionSeckillActivityForm' })

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
  configIds: '',
  totalLimitCount: 0,
  singleLimitCount: 0,
  sort: 0,
  spuId: '',
  remark: ''
})
const formData = ref<Recordable>(createFormData())
// 表单校验
const rules = reactive<FormRules>({
  spuId: [required],
  name: [required],
  startTime: [required],
  endTime: [required],
  sort: [required],
  configIds: [required],
  totalLimitCount: [required],
  singleLimitCount: [required],
  totalStock: [required]
})

// 秒杀时段选项（id / name）
const seckillConfigList = ref<SeckillConfigVO[]>([])
const getSeckillConfigList = async () => {
  seckillConfigList.value = (await SeckillConfigApi.getSimpleSeckillConfigList()) || []
}

// ================= 商品选择相关 =================

const spuSelectRef = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 秒杀配置组件Ref
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.stock',
    rule: (arg) => arg >= 1,
    message: '商品秒杀库存必须大于等于 1 ！！！'
  },
  {
    name: 'productConfig.seckillPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品秒杀价格必须大于等于 0.01 ！！！'
  }
]
const spuList = ref<SeckillActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<SeckillActivityApi.SpuExtension>[]>([])
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
  products?: SeckillProductVO[]
) => {
  const spuProperties: SpuProperty<SeckillActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList([spuId])) as SeckillActivityApi.SpuExtension[]
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
    let config: SeckillActivityApi.SeckillProductVO = {
      spuId: spu.id!,
      skuId: sku.id!,
      stock: 0,
      seckillPrice: 0
    }
    if (typeof products !== 'undefined') {
      const product = products.find((item) => item.skuId === sku.id)
      if (product) {
        product.seckillPrice = Number(formatToFraction(product.seckillPrice))
      }
      config = product || config
    }
    sku.productConfig = config
  })
  spu.skus = selectSkus as SeckillActivityApi.SkuExtension[]
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
      const data = (await SeckillActivityApi.getSeckillActivity(
        id
      )) as SeckillActivityApi.SeckillActivityVO
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
    // 获取秒杀商品配置
    const products = cloneDeep(spuAndSkuListRef.value.getSkuConfigs('productConfig'))
    products.forEach((item: SeckillProductVO) => {
      item.seckillPrice = convertToInteger(item.seckillPrice)
    })
    const data = formData.value as SeckillActivityApi.SeckillActivityVO
    data.products = products
    // 真正提交
    if (formType.value === 'create') {
      await SeckillActivityApi.createSeckillActivity(data)
      message.success(t('common.createSuccess'))
    } else {
      await SeckillActivityApi.updateSeckillActivity(data)
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
const resetForm = async () => {
  spuList.value = []
  spuPropertyList.value = []
  // 每次打开使用全新的初始数据，不带上一次编辑对象的字段（如 id）
  formData.value = createFormData()
  await nextTick()
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(() => {
  getSeckillConfigList()
})
</script>
