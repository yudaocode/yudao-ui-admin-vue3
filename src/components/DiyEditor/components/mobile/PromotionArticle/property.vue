<template>
  <ComponentContainerProperty v-model="formData.style">
    <el-form label-width="40px" :model="formData">
      <el-form-item label="文章" prop="id">
        <el-select
          v-model="formData.id"
          placeholder="请选择文章"
          class="w-full"
          filterable
          remote
          :remote-method="queryArticleList"
          :loading="loading"
        >
          <el-option
            v-for="article in articles"
            :key="article.id"
            :label="article.title"
            :value="article.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </ComponentContainerProperty>
</template>

<script setup lang="ts">
import { PromotionArticleProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'
import * as ArticleApi from '@/api/mall/promotion/article/index'

// 营销文章属性面板
defineOptions({ name: 'PromotionArticleProperty' })

const props = defineProps<{ modelValue: PromotionArticleProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)
// 文章列表
const articles = ref<ArticleApi.ArticleVO>([])

// 加载中
const loading = ref(false)
// 查询文章列表
const queryArticleList = async (title?: string) => {
  loading.value = true
  const { list } = await ArticleApi.getArticlePage({ title, pageSize: 10 })
  articles.value = list
  loading.value = false
}

// 初始化
onMounted(() => {
  queryArticleList()
})
</script>

<style scoped lang="scss"></style>
