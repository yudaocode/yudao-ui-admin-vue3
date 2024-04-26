<template>
  <div>
    <section class="dingflow-design">
      <div class="sticky right-0 top-0 z-10 w-full flex justify-end bg-white p-2 pr-4">
        <el-button type="primary" size="small" @click="test">保存(测试中，待完善)</el-button>
      </div>
      <div class="box-scale">
        <div class="start-event-node">
          <div class="start-event-node-circle">开始</div>
        </div>
        <div class="start-event-node-line"></div>
        <nodeWrap v-model:nodeConfig="nodeConfig"/>
       
        <div class="end-event">
          <div class="end-event-circle">结束</div>
        </div>
      </div>
    </section>
  </div>
  <approverDrawer/>
  <copyerDrawer />
</template>
<script lang="ts" setup>
import nodeWrap from '@/components/SimpleProcessDesigner/src/nodeWrap.vue'
import approverDrawer from '@/components/SimpleProcessDesigner/src/drawer/approverDrawer.vue'
import copyerDrawer from '@/components/SimpleProcessDesigner/src/drawer/copyerDrawer.vue'
import { WorkFlowNode } from '@/components/SimpleProcessDesigner/src/consts'
import { ref } from 'vue'
import { saveBpmSimpleModel, getBpmSimpleModel } from '@/api/bpm/simple'
import { getModel } from '@/api/bpm/model'
import { getForm, FormVO } from '@/api/bpm/form'
defineOptions({ name: 'SimpleWorkflowDesignEditor2' })
const uid = getCurrentInstance().uid
const router = useRouter() // 路由
const { query } = useRoute() // 路由的查询
const modelId = query.modelId
const message = useMessage() // 国际化
const nodeConfig = ref<WorkFlowNode>({
  name: '发起人',
  type: 0,
  id: 'StartEvent_' + uid,
  childNode: undefined,
  attributes: undefined,
  conditionNodes: []
})
// 默认的表单字段权限
const defaultFieldsPermission: any[] = []
const  formType = ref(20);
provide('defaultFieldsPermission', defaultFieldsPermission)
provide('formType', formType)
const test = async () => {
  if (!modelId) {
    message.error('缺少模型 modelId 编号')
    return
  }
  const test = nodeConfig.value
  console.log('test is ', test)
  console.log('nodeConfig.value ', nodeConfig.value)
  const data1 = {
    modelId: modelId,
    simpleModelBody: toRaw(nodeConfig.value)
  }
  const data = {
    modelId: modelId,
    simpleModelBody: nodeConfig.value
  }
  console.log('request json data1 is ', data1)
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
  const bpmnModel = await getModel(modelId)
  if (bpmnModel) {
    formType.value = bpmnModel.formType
    if (formType.value === 10) {
      const bpmnForm = await getForm(bpmnModel.formId) as unknown as FormVO
      const formFields = bpmnForm?.fields
      if (formFields) {
        formFields.forEach((fieldStr: string) => {
          const { field, title } = JSON.parse(fieldStr)
          defaultFieldsPermission.push({
            field,
            title,
            permission: '2'
          })
        })
      }
      console.log('defaultFieldsPermissions', defaultFieldsPermission);
    }
  }
  console.log('the modelId is ', modelId)
  const result = await getBpmSimpleModel(modelId)
  if (result) {
    console.log('get the result is ', result)
    nodeConfig.value = result
  }
})
</script>
<style>
@import url('@/components/SimpleProcessDesigner/theme/workflow.css');

.end-event {
  display: flex;
  direction: columns;
  justify-content: center;
  align-items: center;
}

.end-event-circle {
  display: flex;
  width: 40px;
  height: 40px;
  font-size: 14px;
  color: #f8f8fa;
  background-image: linear-gradient(-30deg, #bbbbc4, #d5d5de), linear-gradient(#bcbcc5, #bcbcc5);
  border-radius: 50%;
  justify-content: center;
  align-items: center;
}

/* .start-event-node {
  color: #191f2566;
  text-align: left;
  border-radius: 50%;
} */
.start-event-node {
  display: flex;
  direction: columns;
  justify-content: center;
  align-items: center;
}

.start-event-node-circle {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #f8f8fa;
  background-image: linear-gradient(90deg, #ff6a00, #f78b3e), linear-gradient(#ff6a00, #ff6a00);
  border-radius: 50%;
}

.start-event-node-line::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 2px;
  height: 100%;
  margin: auto;
  background-color: #cacaca;
  content: '';
}

.start-event-node-line {
  position: relative;
  padding: 20px 0 32px;
}
</style>
