<template>
  <div>
    <section class="dingflow-design">
      <el-row>
        <el-col :span="20" />
        <el-col :span="4">
          <el-button type="primary" size="small" @click="test">保存(用于测试，还未完成)</el-button>
        </el-col>
      </el-row>
      <div class="box-scale">
        <!-- <div class="start-event-node">
          <div class="start-event-node-text">流程开始</div>
          <div class="start-event-node-circle"></div>
          <div class="start-event-node-flow">
            <el-popover placement="right-start" width="auto">
              <div class="add-node-popover-body">
                <a class="add-node-popover-item approver" @click="addType(1)">
                  <div class="item-wrapper">
                    <span class="iconfont"></span>
                  </div>
                  <p>审批人</p>
                </a>
              </div>
              <template #reference>
                <button class="btn" type="button">
                  <span class="iconfont"></span>
                </button>
              </template>
            </el-popover>
          </div>
        </div> -->
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
import addNode from '@/components/SimpleProcessDesigner/src/addNode.vue'
import approverDrawer from '@/components/SimpleProcessDesigner/src/drawer/approverDrawer.vue'
import { ref } from 'vue'
import { saveBpmSimpleModel, getBpmSimpleModel } from '@/api/bpm/simple'
defineOptions({ name: 'SimpleWorkflowDesignEditor' })
const uid = getCurrentInstance().uid
const router = useRouter() // 路由
const { query } = useRoute() // 路由的查询
const modelId = query.modelId
const message = useMessage() // 国际化
const nodeConfig = ref({
  name: '流程开始',
  type: -1,
  id: 'StartEvent_' + uid,
  childNode: undefined
})
const test = async () => {
  if (!modelId) {
    message.error('缺少模型 modelId 编号')
    return
  }
  const data = {
    modelId: modelId,
    simpleModelBody: toRaw(nodeConfig.value)
  }
  console.log('request json data is ', data)
  const result = await saveBpmSimpleModel(data)
  console.log('save the result is ', result)
  if (result) {
    message.success('修改成功')
    close()
  } else {
    message.alert('修改失败')
  }
  
}
const close = () => {
  router.push({ path: '/bpm/manager/model' })
}
onMounted(async () => {
  console.log('the modelId is ', modelId)
  const result = await getBpmSimpleModel(modelId)
  if(result){
    console.log('get the result is ', result)
    nodeConfig.value = result;
  }
})
</script>
<style>
@import url('@/components/SimpleProcessDesigner/theme/workflow.css');
</style>
