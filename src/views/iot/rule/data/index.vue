<template>
  <el-tabs v-model="activeTab" type="border-card">
    <el-tab-pane label="规则" name="rule">
      <RuleIndex />
    </el-tab-pane>
    <el-tab-pane label="目的" name="sink" lazy>
      <SinkIndex />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import RuleIndex from './rule/index.vue'
import SinkIndex from './sink/index.vue'

/** IoT 数据流转 */
defineOptions({ name: 'IoTDataRule' })

const activeTab = ref('rule')
</script>
