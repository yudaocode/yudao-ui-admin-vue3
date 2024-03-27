<template>
  <div>
   
    <section class="dingflow-design">
      <el-row>
        <el-col :span="20"/>
        <el-col :span="4">
          <el-button type="primary" size="small" @click="test">保存(用于测试，还未完成)</el-button>
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
import { saveBpmSimpleModel } from '@/api/bpm/simple'
defineOptions({ name: 'SimpleWorkflowDesignEditor' })
const uid = getCurrentInstance().uid;
const router = useRouter() // 路由
const { query } = useRoute() // 路由的查询
const modelId = query.modelId;
const message = useMessage() // 国际化
const nodeConfig = ref({
  name: '发起人',
  type: 0,
  id: 'Activity_'+uid,
  attributes: {
    "candidateStrategy": '70'
  },
  childNode: undefined
})
const test = async ()=> {
  if (!modelId) {
    message.error('缺少模型 modelId 编号')
    return
  }
  const data = {
    modelId: modelId,
    simpleModelBody: toRaw(nodeConfig.value)
  }
  console.log('request json data is ', data)
  const result =  await saveBpmSimpleModel(data);
  console.log('the result is ', result)
  if(result){
    message.success('修改成功')
  } else {
    message.alert('修改失败');
  }
  close ()
}
const close = () => {
  router.push({ path: '/bpm/manager/model' })
}

</script>
<style>
@import url('@/components/SimpleProcessDesigner/theme/workflow.css');
</style>