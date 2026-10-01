<template>
  <Dialog title="连通测试结果" v-model="dialogVisible" width="800px">
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
          <el-descriptions-item label="是否连通">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="result.connectable" />
          </el-descriptions-item>
          <el-descriptions-item label="耗时">{{ result.elapsedMs }} ms</el-descriptions-item>
          <el-descriptions-item label="服务名称">
            {{ result.serverName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="服务版本">
            {{ result.serverVersion || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="测试过程" :span="2">
            <span class="whitespace-pre-wrap break-all">{{ result.message || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="result.instructions" label="服务说明" :span="2">
            <MarkdownView :content="result.instructions" />
          </el-descriptions-item>
        </el-descriptions>
        <!-- 工具列表 -->
        <template v-if="result.connectable">
          <el-divider content-position="left">工具列表（{{ result.toolCount }}）</el-divider>
          <el-table
            :data="result.tools"
            :stripe="true"
            border
            max-height="340"
            :show-overflow-tooltip="true"
          >
            <template #empty>
              <el-empty description="未发现可用工具" />
            </template>
            <el-table-column label="序号" type="index" width="60" align="center" />
            <el-table-column label="工具名称" prop="name" min-width="140" align="center" />
            <el-table-column label="标题" prop="title" min-width="110" align="center" />
            <el-table-column label="介绍" prop="description" min-width="220" align="center" />
          </el-table>
        </template>
      </template>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import MarkdownView from '@/components/MarkdownView/index.vue'
import { McpApi, McpConnect } from '@/api/ai1/mcp'

/** AI1 MCP 连通测试结果弹窗 */
defineOptions({ name: 'Ai1McpTestForm' })

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 测试的加载中
const result = ref<McpConnect>() // 测试结果

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  result.value = undefined
  loading.value = true
  try {
    result.value = await McpApi.testMcp(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
