<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="65%">
    <Form
      ref="formRef"
      v-loading="formLoading"
      :isCol="true"
      :rules="rules"
      :schema="allSchemas.formSchema"
    >
      <!-- 先选择 -->
      <template #spuIds>
        <el-button @click="spuSelectRef.open()">选择商品</el-button>
        <SpuAndSkuList
          ref="spuAndSkuListRef"
          :rule-config="ruleConfig"
          :spu-list="spuList"
          :spu-property-list-p="spuPropertyList"
        />
      </template>
    </Form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <SpuSelect ref="spuSelectRef" @confirm="selectSpu" />
</template>
<script lang="ts" setup>
import { SpuAndSkuList, SpuProperty, SpuSelect } from '../../components'
import { allSchemas, rules } from './seckillActivity.data'

import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { getPropertyList, RuleConfig } from '@/views/mall/product/spu/components'

defineOptions({ name: 'PromotionSeckillActivityForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const spuSelectRef = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 秒杀配置组件Ref
const ruleConfig: RuleConfig[] = [
  {
    name: 'productConfig.stock',
    rule: (arg) => arg > 1,
    message: '商品秒杀库存必须大于 1 ！！！'
  },
  {
    name: 'productConfig.seckillPrice',
    rule: (arg) => arg > 0.01,
    message: '商品秒杀价格必须大于 0.01 ！！！'
  }
]
/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  await resetForm()
  // 修改时，设置数据 TODO 没测试估计有问题
  if (id) {
    formLoading.value = true
    try {
      const data = await SeckillActivityApi.getSeckillActivity(id)
      formRef.value.setValues(data)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

const spuList = ref<SeckillActivityApi.SpuExtension[]>([]) // 选择的 spu
const spuPropertyList = ref<SpuProperty<SeckillActivityApi.SpuExtension>[]>([])
const selectSpu = (spuIds: number[]) => {
  formRef.value.setValues({ spuIds })
  getSpuDetails(spuIds)
}
/**
 * 获取 SPU 详情
 * TODO 获取 SPU 详情，放到各自活动表单来做，让 SpuAndSkuList 职责单一点
 * @param spuIds
 */
const getSpuDetails = async (spuIds: number[]) => {
  const spuProperties: SpuProperty<SeckillActivityApi.SpuExtension>[] = []
  const res = (await ProductSpuApi.getSpuDetailList(spuIds)) as SeckillActivityApi.SpuExtension[]
  spuList.value = []
  res?.forEach((spu) => {
    // 初始化每个 sku 秒杀配置
    spu.skus?.forEach((sku) => {
      const config: SeckillActivityApi.SeckillProductVO = {
        spuId: spu.id!,
        skuId: sku.id!,
        stock: 0,
        seckillPrice: 0
      }
      sku.productConfig = config
    })
    spuProperties.push({ spuId: spu.id!, spuDetail: spu, propertyList: getPropertyList(spu) })
  })
  spuList.value.push(...res)
  spuPropertyList.value = spuProperties
}

/** 重置表单 */
const resetForm = async () => {
  spuList.value = []
  spuPropertyList.value = []
  await nextTick()
  formRef.value.getElFormRef().resetFields()
}
/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.getElFormRef().validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formRef.value.formModel as SeckillActivityApi.SeckillActivityVO
    data.spuIds = spuList.value.map((spu) => spu.id!)
    data.products = spuAndSkuListRef.value.getSkuConfigs('productConfig')
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
</script>
<style lang="scss" scoped>
.demo-table-expand {
  padding-left: 42px;

  :deep(.el-form-item__label) {
    width: 82px;
    font-weight: bold;
    color: #99a9bf;
  }
}
</style>
