<template>
  <ContentWrap v-loading="formLoading">
    <el-tabs v-model="activeName">
      <el-tab-pane label="商品信息" name="basicInfo">
        <BasicInfoForm
          ref="basicInfoRef"
          v-model:activeName="activeName"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="商品详情" name="description">
        <DescriptionForm
          ref="descriptionRef"
          v-model:activeName="activeName"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="其他设置" name="otherSettings">
        <OtherSettingsForm
          ref="otherSettingsRef"
          v-model:activeName="activeName"
          :propFormData="formData"
        />
      </el-tab-pane>
    </el-tabs>
    <el-form>
      <el-form-item style="float: right">
        <el-button :loading="formLoading" type="primary" @click="submitForm">保存</el-button>
        <el-button @click="close">返回</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>
<script lang="ts" name="ProductSpuForm" setup>
import { cloneDeep } from 'lodash-es'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { BasicInfoForm, DescriptionForm, OtherSettingsForm } from './components'
// 业务api
import * as ProductSpuApi from '@/api/mall/product/spu'
import * as PropertyApi from '@/api/mall/product/property'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter() // 路由
const { params } = useRoute() // 查询参数
const { delView } = useTagsViewStore() // 视图操作

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const activeName = ref('basicInfo') // Tag 激活的窗口
const basicInfoRef = ref<ComponentRef<typeof BasicInfoForm>>() // 商品信息Ref
const descriptionRef = ref<ComponentRef<typeof DescriptionForm>>() // 商品详情Ref
const otherSettingsRef = ref<ComponentRef<typeof OtherSettingsForm>>() // 其他设置Ref
// spu 表单数据
const formData = ref<ProductSpuApi.SpuType>({
  name: '', // 商品名称
  categoryId: null, // 商品分类
  keyword: '', // 关键字
  unit: null, // 单位
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  deliveryTemplateId: 1, // 运费模版
  specType: false, // 商品规格
  subCommissionType: false, // 分销类型
  skus: [
    {
      price: 0, // 商品价格
      marketPrice: 0, // 市场价
      costPrice: 0, // 成本价
      barCode: '', // 商品条码
      picUrl: '', // 图片地址
      stock: 0, // 库存
      weight: 0, // 商品重量
      volume: 0, // 商品体积
      subCommissionFirstPrice: 0, // 一级分销的佣金
      subCommissionSecondPrice: 0 // 二级分销的佣金
    }
  ],
  description: '', // 商品详情
  sort: 0, // 商品排序
  giveIntegral: 0, // 赠送积分
  virtualSalesCount: 0, // 虚拟销量
  recommendHot: false, // 是否热卖
  recommendBenefit: false, // 是否优惠
  recommendBest: false, // 是否精品
  recommendNew: false, // 是否新品
  recommendGood: false // 是否优品
})

/** 获得详情 */
const getDetail = async () => {
  const id = params.spuId as number
  if (id) {
    formLoading.value = true
    try {
      const res = (await ProductSpuApi.getSpu(id)) as ProductSpuApi.SpuType
      formData.value = res
      // 直接取第一个值就能得到所有属性的id
      // TODO @puhui999：可以直接拿 propertyName 拼接处规格 id + 属性，可以看下商品 uniapp 详情的做法
      const propertyIds = res.skus[0]?.properties.map((item) => item.propertyId)
      const PropertyS = await PropertyApi.getPropertyListAndValue({ propertyIds })
      await nextTick()
      // 回显商品属性
      basicInfoRef.value.addAttribute(PropertyS)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交按钮 */
const submitForm = async () => {
  // 提交请求
  formLoading.value = true
  // 三个表单逐一校验，如果有一个表单校验不通过则切换到对应表单，如果有两个及以上的情况则切换到最前面的一个并弹出提示消息
  // 校验各表单
  try {
    await unref(basicInfoRef)?.validate()
    await unref(descriptionRef)?.validate()
    await unref(otherSettingsRef)?.validate()
    const deepCopyFormData = cloneDeep(unref(formData.value)) // 深拷贝一份 fix:这样最终 server 端不满足，不需要恢复，
    // 处理掉一些无关数据
    deepCopyFormData.skus.forEach((item) => {
      // 给sku name赋值
      item.name = deepCopyFormData.name
    })
    // 处理轮播图列表
    const newSliderPicUrls = []
    deepCopyFormData.sliderPicUrls.forEach((item) => {
      // 如果是前端选的图
      // TODO @puhui999：疑问哈，为啥会是 object 呀？fix
      typeof item === 'object' ? newSliderPicUrls.push(item.url) : newSliderPicUrls.push(item)
    })
    deepCopyFormData.sliderPicUrls = newSliderPicUrls
    // 校验都通过后提交表单
    const data = deepCopyFormData as ProductSpuApi.SpuType
    const id = params.spuId as number
    if (!id) {
      await ProductSpuApi.createSpu(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductSpuApi.updateSpu(data)
      message.success(t('common.updateSuccess'))
    }
    close()
  } finally {
    formLoading.value = false
  }
}

/**
 * 重置表单
 * fix:先注释保留，如果后期没有使用到则移除
 */
// const resetForm = async () => {
//   formData.value = {
//     name: '', // 商品名称
//     categoryId: 0, // 商品分类
//     keyword: '', // 关键字
//     unit: '', // 单位
//     picUrl: '', // 商品封面图
//     sliderPicUrls: [], // 商品轮播图
//     introduction: '', // 商品简介
//     deliveryTemplateId: 0, // 运费模版
//     selectRule: '',
//     specType: false, // 商品规格
//     subCommissionType: false, // 分销类型
//     description: '', // 商品详情
//     sort: 1, // 商品排序
//     giveIntegral: 1, // 赠送积分
//     virtualSalesCount: 1, // 虚拟销量
//     recommendHot: false, // 是否热卖
//     recommendBenefit: false, // 是否优惠
//     recommendBest: false, // 是否精品
//     recommendNew: false, // 是否新品
//     recommendGood: false // 是否优品
//   }
// }
/** 关闭按钮 */
const close = () => {
  delView(unref(currentRoute))
  push('/product/product-spu')
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
})
</script>
