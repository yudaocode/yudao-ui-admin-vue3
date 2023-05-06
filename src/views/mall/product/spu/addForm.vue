<template>
  <ContentWrap v-loading="formLoading">
    <el-tabs v-model="activeName">
      <el-tab-pane label="商品信息" name="basicInfo">
        <BasicInfoForm
          ref="BasicInfoRef"
          v-model:activeName="activeName"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="商品详情" name="description">
        <DescriptionForm
          ref="DescriptionRef"
          v-model:activeName="activeName"
          :propFormData="formData"
        />
      </el-tab-pane>
      <el-tab-pane label="其他设置" name="otherSettings">
        <OtherSettingsForm
          ref="OtherSettingsRef"
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
<script lang="ts" name="ProductManagementForm" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { BasicInfoForm, DescriptionForm, OtherSettingsForm } from './components'
import type { SpuType } from '@/api/mall/product/management/type/spuType' // 业务api
import * as managementApi from '@/api/mall/product/management/spu'
import * as PropertyApi from '@/api/mall/product/property'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter() // 路由
const { query } = useRoute() // 查询参数
const { delView } = useTagsViewStore() // 视图操作

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const activeName = ref('basicInfo') // Tag 激活的窗口
const BasicInfoRef = ref<ComponentRef<typeof BasicInfoForm>>() // 商品信息Ref
const DescriptionRef = ref<ComponentRef<typeof DescriptionForm>>() // 商品详情Ref
const OtherSettingsRef = ref<ComponentRef<typeof OtherSettingsForm>>() // 其他设置Ref
const formData = ref<SpuType>({
  name: '213', // 商品名称
  categoryId: null, // 商品分类
  keyword: '213', // 关键字
  unit: null, // 单位
  picUrl:
    'http://127.0.0.1:48080/admin-api/infra/file/4/get/6ffdf8f5dfc03f7ceec1ff1ebc138adb8b721a057d505ccfb0e61a8783af1371.png', // 商品封面图
  sliderPicUrls: [
    {
      name: 'http://127.0.0.1:48080/admin-api/infra/file/4/get/6ffdf8f5dfc03f7ceec1ff1ebc138adb8b721a057d505ccfb0e61a8783af1371.png',
      url: 'http://127.0.0.1:48080/admin-api/infra/file/4/get/6ffdf8f5dfc03f7ceec1ff1ebc138adb8b721a057d505ccfb0e61a8783af1371.png'
    }
  ], // 商品轮播图
  introduction: '213', // 商品简介
  deliveryTemplateId: 0, // 运费模版
  specType: false, // 商品规格
  subCommissionType: false, // 分销类型
  skus: [
    {
      /**
       * 商品价格，单位：分 TODO @puhui999：注释放在尾巴哈，简洁一点~
       */
      price: 0,
      /**
       * 市场价，单位：分
       */
      marketPrice: 0,
      /**
       * 成本价，单位：分
       */
      costPrice: 0,
      /**
       * 商品条码
       */
      barCode: '',
      /**
       * 图片地址
       */
      picUrl: '',
      /**
       * 库存
       */
      stock: 0,
      /**
       * 商品重量，单位：kg 千克
       */
      weight: 0,
      /**
       * 商品体积，单位：m^3 平米
       */
      volume: 0,
      /**
       * 一级分销的佣金，单位：分
       */
      subCommissionFirstPrice: 0,
      /**
       * 二级分销的佣金，单位：分
       */
      subCommissionSecondPrice: 0
    }
  ],
  description: '5425', // 商品详情
  sort: 1, // 商品排序
  giveIntegral: 1, // 赠送积分
  virtualSalesCount: 1, // 虚拟销量
  recommendHot: false, // 是否热卖
  recommendBenefit: false, // 是否优惠
  recommendBest: false, // 是否精品
  recommendNew: false, // 是否新品
  recommendGood: false // 是否优品
})

/** 获得详情 */
const getDetail = async () => {
  const id = query.id as unknown as number
  if (id) {
    formLoading.value = true
    try {
      const res = (await managementApi.getSpu(id)) as SpuType
      formData.value = res
      // 直接取第一个值就能得到所有属性的id
      // TODO @puhui999：可以直接拿 propertyName 拼接处规格 id + 属性，可以看下商品 uniapp 详情的做法
      const propertyIds = res.skus[0]?.properties.map((item) => item.propertyId)
      const PropertyS = await PropertyApi.getPropertyListAndValue({ propertyIds })
      await nextTick()
      // 回显商品属性
      BasicInfoRef.value.addAttribute(PropertyS)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交按钮 */
const submitForm = async () => {
  // 提交请求
  formLoading.value = true
  const newSkus = JSON.parse(JSON.stringify(formData.value.skus)) //深拷贝一份skus保存失败时使用
  // TODO 三个表单逐一校验，如果有一个表单校验不通过则切换到对应表单，如果有两个及以上的情况则切换到最前面的一个并弹出提示消息
  // 校验各表单
  try {
    await unref(BasicInfoRef)?.validate()
    await unref(DescriptionRef)?.validate()
    await unref(OtherSettingsRef)?.validate()
    // TODO @puhui：直接做深拷贝？这样最终 server 端不满足，不需要恢复
    // 处理掉一些无关数据
    formData.value.skus.forEach((item) => {
      // 给sku name赋值
      item.name = formData.value.name
      // 多规格情况移除skus相关属性值value
      if (formData.value.specType) {
        item.properties.forEach((item2) => {
          delete item2.valueName
        })
      }
    })
    // 处理轮播图列表
    const newSliderPicUrls = []
    formData.value.sliderPicUrls.forEach((item) => {
      // 如果是前端选的图
      // TODO @puhui999：疑问哈，为啥会是 object 呀？
      if (typeof item === 'object') {
        newSliderPicUrls.push(item.url)
      } else {
        newSliderPicUrls.push(item)
      }
    })
    formData.value.sliderPicUrls = newSliderPicUrls
    // 校验都通过后提交表单
    const data = formData.value as SpuType
    // 移除skus.
    const id = query.id as unknown as number
    if (!id) {
      await managementApi.createSpu(data)
      message.success(t('common.createSuccess'))
    } else {
      await managementApi.updateSpu(data)
      message.success(t('common.updateSuccess'))
    }
    close()
  } catch (e) {
    // 如果是后端校验失败,恢复skus数据
    if (typeof e === 'string') {
      formData.value.skus = newSkus
    }
  } finally {
    formLoading.value = false
  }
}

/**
 * 重置表单
 */
const resetForm = async () => {
  formData.value = {
    name: '', // 商品名称
    categoryId: 0, // 商品分类
    keyword: '', // 关键字
    unit: '', // 单位
    picUrl: '', // 商品封面图
    sliderPicUrls: [], // 商品轮播图
    introduction: '', // 商品简介
    deliveryTemplateId: 0, // 运费模版
    selectRule: '',
    specType: false, // 商品规格
    subCommissionType: false, // 分销类型
    description: '', // 商品详情
    sort: 1, // 商品排序
    giveIntegral: 1, // 赠送积分
    virtualSalesCount: 1, // 虚拟销量
    recommendHot: false, // 是否热卖
    recommendBenefit: false, // 是否优惠
    recommendBest: false, // 是否精品
    recommendNew: false, // 是否新品
    recommendGood: false // 是否优品
  }
}
/** 关闭按钮 */
const close = () => {
  // TODO @puhui999：是不是不用 reset 呀？close 默认销毁
  resetForm()
  delView(unref(currentRoute))
  push('/product/product-management')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
