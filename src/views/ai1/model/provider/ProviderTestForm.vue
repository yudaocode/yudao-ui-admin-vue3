<template>
  <Dialog title="连通测试结果" v-model="dialogVisible" width="560px">
    <div v-loading="loading" class="min-h-120px">
      <template v-if="result">
        <!-- 连通结论 -->
        <el-alert
          :type="result.connectable ? 'success' : 'error'"
          :title="result.connectable ? '连接成功' : '连接失败'"
          :closable="false"
          show-icon
        />
        <!-- 测试明细 -->
        <el-descriptions :column="2" :label-width="100" border class="mt-12px">
          <el-descriptions-item label="模型供应商">{{ providerName }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ result.elapsedMs }} ms</el-descriptions-item>
          <el-descriptions-item label="HTTP 状态码">
            {{ result.httpCode === 0 ? '0（网络异常，未收到响应）' : result.httpCode }}
          </el-descriptions-item>
          <el-descriptions-item label="是否连通">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="result.connectable" />
          </el-descriptions-item>
          <el-descriptions-item label="测试过程" :span="2">
            <span class="whitespace-pre-wrap break-all">{{ result.message || '-' }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { ProviderApi, ProviderConnect } from '@/api/ai1/model/provider'

/** AI1 模型供应商连通测试结果弹窗 */
defineOptions({ name: 'Ai1ProviderTestForm' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 测试的加载中
const providerName = ref('') // 模型供应商名称
const result = ref<ProviderConnect>() // 测试结果

/** 打开弹窗 */
const open = async (id: number, name: string) => {
  dialogVisible.value = true
  providerName.value = name
  result.value = undefined
  loading.value = true
  try {
    result.value = await ProviderApi.testProvider(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
