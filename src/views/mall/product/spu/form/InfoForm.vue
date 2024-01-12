<!-- 商品发布 - 基础设置 -->
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
      <UploadImg v-model="formData.picUrl" height="80px" :disabled="isDetail" />
    </el-form-item>
    <el-form-item label="商品轮播图" prop="sliderPicUrls">
      <UploadImgs v-model:modelValue="formData.sliderPicUrls" :disabled="isDetail" />
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { copyValueToTarget } from '@/utils'
import { propTypes } from '@/utils/propTypes'
import { defaultProps, handleTree } from '@/utils/tree'
import type { Spu } from '@/api/mall/product/spu'
import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductBrandApi from '@/api/mall/product/brand'
import { BrandVO } from '@/api/mall/product/brand'
import { CategoryVO } from '@/api/mall/product/category'

defineOptions({ name: 'ProductSpuInfoForm' })
const props = defineProps({
  propFormData: {
    type: Object as PropType<Spu>,
    default: () => {}
  },
  isDetail: propTypes.bool.def(false) // 是否作为详情组件
})

const message = useMessage() // 消息弹窗

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

/** 将传进来的值赋值给 formData */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return
    }
    copyValueToTarget(formData, data)
    // TODO @puhui999：优化多文件上传，看看有没可能搞成返回 v-model 图片列表这种
    formData.sliderPicUrls = data['sliderPicUrls']?.map((item) => ({
      url: item
    }))
  },
  {
    immediate: true
  }
)

/** 表单校验 */
const emit = defineEmits(['update:activeName'])
const validate = async () => {
  if (!formRef) return
  try {
    await unref(formRef)?.validate()
    // 校验通过更新数据
    Object.assign(props.propFormData, formData)
  } catch (e) {
    message.error('【基础设置】不完善，请填写相关信息')
    emit('update:activeName', 'info')
    throw e // 目的截断之后的校验
  }
}
defineExpose({ validate })

/** 初始化 */
const brandList = ref<BrandVO[]>([]) // 商品品牌列表
const categoryList = ref<CategoryVO[]>([]) // 商品分类树
onMounted(async () => {
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id')
  // 获取商品品牌列表
  brandList.value = await ProductBrandApi.getSimpleBrandList()
})
</script>
