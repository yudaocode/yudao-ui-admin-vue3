<template>
  <Dialog :title="`检索测试：${knowledgeBaseName}`" v-model="dialogVisible" width="860px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="检索内容" prop="query">
        <el-input v-model="formData.query" type="textarea" :rows="3" placeholder="请输入检索内容" />
      </el-form-item>
      <el-form-item label="检索数量" prop="topK">
        <el-input-number v-model="formData.topK" :min="1" :max="20" class="!w-160px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSearch">
          <Icon icon="ep:search" class="mr-5px" /> 检索
        </el-button>
      </el-form-item>
    </el-form>
    <!-- 检索结果 -->
    <el-table v-loading="loading" :data="list" :stripe="true" border max-height="420">
      <el-table-column label="序号" align="center" type="index" width="60" />
      <el-table-column
        label="文档名称"
        align="center"
        prop="documentName"
        min-width="140"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="分片序号" align="center" prop="chunkIndex" width="90" />
      <el-table-column label="相似度" align="center" width="100">
        <template #default="scope">
          <el-tag>{{ Number(scope.row.score).toFixed(4) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="命中内容" prop="text" min-width="320" :show-overflow-tooltip="true" />
    </el-table>
  </Dialog>
</template>
<script setup lang="ts">
import { KnowledgeBaseApi, KnowledgeBase, KnowledgeSearch } from '@/api/ai1/knowledge/base'

/** AI1 知识库检索测试 */
defineOptions({ name: 'Ai1KnowledgeSearchForm' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 检索的加载中
const knowledgeBaseName = ref('') // 知识库名称
const formData = ref({
  id: undefined as number | undefined,
  query: '',
  topK: undefined as number | undefined
})
const formRules = reactive({
  query: [{ required: true, message: '检索内容不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const list = ref<KnowledgeSearch[]>([]) // 检索结果

/** 打开弹窗 */
const open = (knowledgeBase: KnowledgeBase) => {
  dialogVisible.value = true
  knowledgeBaseName.value = knowledgeBase.name
  formRef.value?.resetFields()
  formData.value = {
    id: knowledgeBase.id,
    query: '',
    topK: knowledgeBase.topK
  }
  list.value = []
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 检索 */
const handleSearch = async () => {
  // 校验表单
  await formRef.value.validate()
  // 发起检索
  loading.value = true
  try {
    list.value = await KnowledgeBaseApi.searchKnowledgeBase({
      id: formData.value.id!,
      query: formData.value.query,
      topK: formData.value.topK
    })
  } finally {
    loading.value = false
  }
}
</script>
