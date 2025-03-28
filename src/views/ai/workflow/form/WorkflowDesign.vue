<template>
  <div class="relative" style="width: 100%; height: 700px">
    <Tinyflow
      v-if="workflowData"
      ref="tinyflowRef"
      :className="'custom-class'"
      :style="{ width: '100%', height: '100%' }"
      :data="workflowData"
      :provider="provider"
    />
    <div class="absolute top-30px right-30px">
      <el-button @click="testWorkflowModel" type="primary" v-hasPermi="['ai:workflow:test']">
        测试
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import Tinyflow from '@/components/Tinyflow/Tinyflow.vue'

defineProps<{
  provider: any
}>()

const tinyflowRef = ref()
const workflowData = inject('workflowData') as Ref

const testWorkflowModel = () => {
  // TODO @lesan 测试
}

/** 表单校验 */
const validate = async () => {
  try {
    // 获取最新的流程数据
    if (!workflowData.value) {
      throw new Error('请设计流程')
    }
    workflowData.value = tinyflowRef.value.getData()
    return true
  } catch (error) {
    throw error
  }
}
defineExpose({
  validate
})
</script>
