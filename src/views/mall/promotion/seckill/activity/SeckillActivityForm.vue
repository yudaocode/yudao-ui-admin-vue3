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
      <template #spuId>
        <el-button @click="spuAndSkuSelectForm.open('秒杀商品选择')">选择商品</el-button>
        <!-- TODO @puhui999：默认展开 SKU 哈，毕竟 SKU 是主角，SPU 是配角 -->
        <SpuAndSkuList ref="spuAndSkuListRef" :spu-list="spuList" />
      </template>
    </Form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <!-- TODO @puhui999：这个组件是不是 SpuSelect，不需要带 sku 或者 Form 呀 -->
  <SpuAndSkuSelectForm ref="spuAndSkuSelectForm" @confirm="selectSpu" />
</template>
<script lang="ts" name="PromotionSeckillActivityForm" setup>
import { SpuAndSkuList, SpuAndSkuSelectForm } from './components'
import { allSchemas, rules } from './seckillActivity.data'
import { Spu } from '@/api/mall/product/spu'

import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const spuAndSkuSelectForm = ref() // 商品和属性选择 Ref
const spuAndSkuListRef = ref() // sku 秒杀配置组件Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
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

const spuList = ref<Spu[]>([]) // 选择的 spu
const selectSpu = (val: Spu) => {
  formRef.value.setValues({ spuId: val.id })
  spuList.value = [val]
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
    data.products = spuAndSkuListRef.value.getSkuConfigs()
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
