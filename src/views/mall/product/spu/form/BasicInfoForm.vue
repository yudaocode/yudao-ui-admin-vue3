<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" :disabled="isDetail">
    <el-form-item label="商品名称" prop="name">
      <el-input
        v-model="formData.name"
        placeholder="请输入商品名称"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 2 }"
        maxlength="64"
        :show-word-limit="true"
        :clearable="true"
        class="w-80!"
      />
    </el-form-item>
    <el-form-item label="商品分类" prop="categoryId">
      <el-cascader
        v-model="formData.categoryId"
        :options="categoryList"
        :props="defaultProps"
        class="w-80"
        clearable
        placeholder="请选择商品分类"
        filterable
      />
    </el-form-item>
    <el-form-item label="商品品牌" prop="brandId">
      <el-select v-model="formData.brandId" placeholder="请选择商品品牌" class="w-80">
        <el-option
          v-for="item in brandList"
          :key="item.id"
          :label="item.name"
          :value="item.id as number"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="商品关键字" prop="keyword">
      <el-input v-model="formData.keyword" placeholder="请输入商品关键字" class="w-80!" />
    </el-form-item>
    <el-form-item label="商品简介" prop="introduction">
      <el-input
        v-model="formData.introduction"
        placeholder="请输入商品名称"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 2 }"
        maxlength="128"
        :show-word-limit="true"
        :clearable="true"
        class="w-80!"
      />
    </el-form-item>
    <el-form-item label="商品封面图" prop="picUrl">
      <UploadImg v-model="formData.picUrl" height="80px" />
    </el-form-item>
    <el-form-item label="商品轮播图" prop="sliderPicUrls">
      <UploadImgs v-model:modelValue="formData.sliderPicUrls" />
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { copyValueToTarget } from '@/utils'
import { propTypes } from '@/utils/propTypes'
import { defaultProps, handleTree, treeToString } from '@/utils/tree'
import type { Spu } from '@/api/mall/product/spu'
import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductBrandApi from '@/api/mall/product/brand'
import { BrandVO } from '@/api/mall/product/brand'

defineOptions({ name: 'ProductSpuBasicInfoForm' })

const message = useMessage() // 消息弹窗

const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  activeName: propTypes.string.def(''),
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})

const formRef = ref() // 表单 Ref
const formData = reactive<Spu>({
  name: '', // 商品名称
  categoryId: undefined, // 商品分类
  keyword: '', // 关键字
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  brandId: undefined // 商品品牌
})
const rules = reactive({
  name: [required],
  categoryId: [required],
  keyword: [required],
  introduction: [required],
  picUrl: [required],
  sliderPicUrls: [required],
  brandId: [required]
})

/**
 * 将传进来的值赋值给 formData
 */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return
    }
    copyValueToTarget(formData, data)
    formData.sliderPicUrls = data['sliderPicUrls']?.map((item) => ({
      url: item
    }))
  },
  {
    immediate: true
  }
)

/**
 * 表单校验
 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  // 校验表单
  if (!formRef) return
  return await unref(formRef).validate((valid) => {
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
defineExpose({ validate })

/** 获取分类的节点的完整结构 */
const categoryList = ref<any[]>([]) // 分类树
const formatCategoryName = (categoryId: number) => {
  return treeToString(categoryList.value, categoryId)
}

const brandList = ref<BrandVO[]>([]) // 精简商品品牌列表
onMounted(async () => {
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
  // 获取商品品牌列表
  brandList.value = await ProductBrandApi.getSimpleBrandList()
})
</script>
