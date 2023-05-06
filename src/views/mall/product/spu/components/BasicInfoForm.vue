<template>
  <el-form ref="ProductManagementBasicInfoRef" :model="formData" :rules="rules" label-width="120px">
    <el-row>
      <el-col :span="12">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <!-- TODO @puhui999：只能选根节点 -->
        <el-form-item label="商品分类" prop="categoryId">
          <el-tree-select
            v-model="formData.categoryId"
            :data="categoryList"
            :props="defaultProps"
            check-strictly
            node-key="id"
            placeholder="请选择商品分类"
            class="w-1/1"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品关键字" prop="keyword">
          <el-input v-model="formData.keyword" placeholder="请输入商品关键字" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="单位" prop="unit">
          <el-select v-model="formData.unit" placeholder="请选择单位" class="w-1/1">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.PRODUCT_UNIT)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品简介" prop="introduction">
          <el-input
            v-model="formData.introduction"
            :rows="3"
            placeholder="请输入商品简介"
            type="textarea"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品封面图" prop="picUrl">
          <UploadImg v-model="formData.picUrl" height="80px" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item label="商品轮播图" prop="sliderPicUrls">
          <UploadImgs v-model="formData.sliderPicUrls" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="运费模板" prop="deliveryTemplateId">
          <el-select v-model="formData.deliveryTemplateId" placeholder="请选择" class="w-1/1">
            <el-option v-for="item in []" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-button class="ml-20px">运费模板</el-button>
      </el-col>
      <el-col :span="12">
        <el-form-item label="商品规格" props="specType">
          <el-radio-group v-model="formData.specType" @change="onChangeSpec">
            <el-radio :label="false" class="radio">单规格</el-radio>
            <el-radio :label="true">多规格</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="分销类型" props="subCommissionType">
          <el-radio-group v-model="formData.subCommissionType" @change="changeSubCommissionType">
            <el-radio :label="false">默认设置</el-radio>
            <el-radio :label="true" class="radio">自行设置</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-col>
      <!-- 多规格添加-->
      <el-col :span="24">
        <el-form-item v-if="formData.specType" label="商品属性">
          <!-- TODO @puhui999：参考 https://admin.java.crmeb.net/store/list/creatProduct 添加规格好做么？添加的时候，不用输入备注哈 -->
          <el-button class="mr-15px mb-10px" @click="AttributesAddFormRef.open">添加规格</el-button>
          <ProductAttributes :attribute-data="attributeList" />
        </el-form-item>
        <template v-if="formData.specType && attributeList.length > 0">
          <el-form-item label="批量设置">
            <SkuList :attributeList="attributeList" :is-batch="true" :prop-form-data="formData" />
          </el-form-item>
          <el-form-item label="属性列表">
            <SkuList :attributeList="attributeList" :prop-form-data="formData" />
          </el-form-item>
        </template>
        <el-form-item v-if="!formData.specType">
          <SkuList :attributeList="attributeList" :prop-form-data="formData" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
  <ProductAttributesAddForm ref="AttributesAddFormRef" @success="addAttribute" />
</template>
<script lang="ts" name="ProductManagementBasicInfoForm" setup>
import { PropType } from 'vue'
import { defaultProps, handleTree } from '@/utils/tree'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { SpuType } from '@/api/mall/product/management/type/spuType'
import { UploadImg, UploadImgs } from '@/components/UploadFile'
import { copyValueToTarget } from '@/utils/object'
import { ProductAttributes, ProductAttributesAddForm, SkuList } from './index'
import * as ProductCategoryApi from '@/api/mall/product/category'
import { propTypes } from '@/utils/propTypes'
const message = useMessage() // 消息弹窗

const props = defineProps({
  propFormData: {
    type: Object as PropType<SpuType>,
    default: () => {}
  },
  activeName: propTypes.string.def('')
})
const AttributesAddFormRef = ref() // 添加商品属性表单 TODO @puhui999：小写开头哈
const ProductManagementBasicInfoRef = ref() // 表单Ref TODO @puhui999：小写开头哈
// TODO @puhui999：attributeList 改成 propertyList，会更统一一点
const attributeList = ref([]) // 商品属性列表
/** 添加商品属性 */ // TODO @puhui999：propFormData 算出来
const addAttribute = (property: any) => {
  if (Array.isArray(property)) {
    attributeList.value = property
    return
  }
  attributeList.value.push(property)
}
const formData = reactive<SpuType>({
  name: '', // 商品名称
  categoryId: undefined, // 商品分类
  keyword: '', // 关键字
  unit: '', // 单位
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  deliveryTemplateId: 1, // 运费模版
  specType: false, // 商品规格
  subCommissionType: false, // 分销类型
  skus: []
})
const rules = reactive({
  name: [required],
  categoryId: [required],
  keyword: [required],
  unit: [required],
  introduction: [required],
  picUrl: [required],
  sliderPicUrls: [required],
  // deliveryTemplateId: [required],
  specType: [required],
  subCommissionType: [required]
})

/**
 * 将传进来的值赋值给 formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) return
    copyValueToTarget(formData, data)
  },
  {
    deep: true,
    immediate: true
  }
)

/**
 * 表单校验
 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  // 校验表单
  if (!ProductManagementBasicInfoRef) return
  return await unref(ProductManagementBasicInfoRef).validate((valid) => {
    if (!valid) {
      message.warning('商品信息未完善！！')
      emit('update:activeName', 'basicInfo')
      // 目的截断之后的校验
      throw new Error('商品信息未完善！！')
    } else {
      // 校验通过更新数据
      Object.assign(props.propFormData, formData)
    }
  })
}
defineExpose({ validate, addAttribute })

/** 分销类型 */
const changeSubCommissionType = () => {
  // 默认为零，类型切换后也要重置为零
  for (const item of formData.skus) {
    item.subCommissionFirstPrice = 0
    item.subCommissionSecondPrice = 0
  }
}

/** 选择规格 */
const onChangeSpec = () => {
  // 重置商品属性列表
  attributeList.value = []
  // 重置sku列表
  formData.skus = [
    {
      price: 0,
      marketPrice: 0,
      costPrice: 0,
      barCode: '',
      picUrl: '',
      stock: 0,
      weight: 0,
      volume: 0,
      subCommissionFirstPrice: 0,
      subCommissionSecondPrice: 0
    }
  ]
}

const categoryList = ref() // 分类树
onMounted(async () => {
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
})
</script>
