<!-- TODO @lesan：要不叫搞个 design 单独一个路由 -->
<template>
  <div style="width: 100%; height: calc(100vh - 160px)">
    <Tinyflow
      ref="tinyflowRef"
      :className="'custom-class'"
      :style="{ width: '100%', height: '100%' }"
      v-if="initialData"
      :data="initialData"
      :provider="provider"
    />
  </div>
  <div class="absolute top-30px right-30px">
    <el-button @click="updateWorkflowModel" type="primary" v-hasPermi="['ai:workflow:update']">
      保存
    </el-button>
    <el-button @click="testWorkflowModel" type="primary" v-hasPermi="['ai:workflow:test']">
      测试
    </el-button>
  </div>
</template>

<script setup lang="ts">
import Tinyflow from '@/components/Tinyflow/Tinyflow.vue'
import * as WorkflowApi from '@/api/ai/workflow'
import { ApiKeyApi } from '@/api/ai/model/apiKey'

const route = useRoute()
const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const tinyflowRef = ref()
// TODO @lesan：待接入
const provider = ref({ llm: () => [], knowledge: () => [], internal: () => [] })
const initialData = ref()

const loadData = async () => {
  try {
    const [apiKeys, flowData] = await Promise.all([
      ApiKeyApi.getApiKeySimpleList(),
      WorkflowApi.getWorkflow(route.params.id)
    ])

    // 更新 provider
    provider.value = {
      llm: () =>
        apiKeys.map(({ id, name }) => ({
          value: id,
          label: name
        })),
      knowledge: () => [],
      internal: () => []
    }

    // 更新流程图数据
    initialData.value = JSON.parse(flowData.model)
  } catch {}
}

const updateWorkflowModel = async () => {
  try {
    const model = tinyflowRef.value.getData()
    const data = {
      model: JSON.stringify(model),
      id: route.params.id
    }
    await message.confirm('确认保存流程模型？')
    await WorkflowApi.updateWorkflowModel(data)
    message.success(t('common.updateSuccess'))
    await loadData()
  } catch {}
}

const testWorkflowModel = () => {
  // TODO @lesan 测试
}

watchEffect(() => {
  if (route.params.id) {
    loadData()
  }
})
</script>
