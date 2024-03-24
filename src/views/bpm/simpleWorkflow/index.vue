<template>
  <div>
   
    <section class="dingflow-design">
      <el-row>
        <el-col :span="20"/>
        <el-col :span="4">
          <el-button type="primary" size="small" @click="test">测试</el-button>
        </el-col>
      </el-row>
      <div class="box-scale">
        <nodeWrap v-model:nodeConfig="nodeConfig" />
        <div class="end-node">
          <div class="end-node-circle"></div>
          <div class="end-node-text">流程结束</div>
        </div>
      </div>
    </section>
  </div>
  <approverDrawer />
</template>
<script lang="ts" setup>
import nodeWrap from '@/components/SimpleProcessDesigner/src/nodeWrap.vue'
import approverDrawer from '@/components/SimpleProcessDesigner/src/drawer/approverDrawer.vue'
import { ref } from 'vue'
defineOptions({ name: 'SimpleWorkflowDesignEditor' })
const nodeConfig = ref({
  name: '发起人',
  type: 0,
  id: 'root',
  nodeUserList: [],
  attributes: {
    "candidateStrategy": 70
  },
  childNode: {},
})
const test = ()=> {
  console.log('json format', toRaw(nodeConfig.value))
}
</script>
<style>
@import url('@/components/SimpleProcessDesigner/theme/workflow.css');
</style>