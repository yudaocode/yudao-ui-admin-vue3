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
import { SpuType } from '@/api/mall/product/management/type' // const { t } = useI18n() // 国际化

// const { t } = useI18n() // 国际化
// const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter() // 路由
// const { query } = useRoute() // 查询参数
const { delView } = useTagsViewStore() // 视图操作

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const activeName = ref('basicInfo') // Tag 激活的窗口
const BasicInfoRef = ref<ComponentRef<typeof BasicInfoForm>>() // 商品信息Ref
const DescriptionRef = ref<ComponentRef<typeof DescriptionForm>>() // 商品详情Ref
const OtherSettingsRef = ref<ComponentRef<typeof OtherSettingsForm>>() // 其他设置Ref
const formData = ref<SpuType>({
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
})
/** 获得详情 */
const getDetail = async () => {}

/** 提交按钮 */
const submitForm = async () => {
  // TODO 三个表单逐一校验，如果有一个表单校验不通过则切换到对应表单，如果有两个及以上的情况则切换到最前面的一个并弹出提示消息
  // 校验各表单
  try {
    await unref(BasicInfoRef)?.validate()
    await unref(DescriptionRef)?.validate()
    await unref(OtherSettingsRef)?.validate()
    // 校验都通过后提交表单
    console.log(formData.value)
  } catch {}
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
  resetForm()
  delView(unref(currentRoute))
  push('/product/product-management')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
