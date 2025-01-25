<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
  >
    <template #header>
      <div class="config-header">
        <input
          v-if="showInput"
          type="text"
          class="config-editable-input"
          @blur="blurEvent()"
          v-mountedFocus
          v-model="nodeName"
          :placeholder="nodeName"
        />
        <div v-else class="node-name">
          {{ nodeName }} <Icon class="ml-1" icon="ep:edit-pen" :size="16" @click="clickIcon()" />
        </div>
        <div class="divide-line"></div>
      </div>
    </template>
    <div>
      <el-form ref="formRef" :model="configForm" label-position="top" :rules="formRules">
        <el-form-item label="触发器类型" prop="type">
          <el-select v-model="configForm.type">
            <el-option
              v-for="(item, index) in TRIGGER_TYPES"
              :key="index"
              :value="item.value"
              :label="item.label"
            />
          </el-select>
        </el-form-item>
        <div
          v-if="configForm.type === TriggerTypeEnum.HTTP_REQUEST && configForm.httpRequestSetting"
        >
          <el-form-item>
            <el-alert
              title="仅支持 POST 请求，以请求体方式接收参数"
              type="warning"
              show-icon
              :closable="false"
            />
          </el-form-item>
          <el-form-item label="请求地址" prop="httpRequestSetting.url">
            <el-input v-model="configForm.httpRequestSetting.url" />
          </el-form-item>
          <HttpRequestParamSetting
            :header="configForm.httpRequestSetting.header"
            :body="configForm.httpRequestSetting.body"
            :bind="'httpRequestSetting'"
          />
        </div>
      </el-form>
    </div>
    <template #footer>
      <el-divider />
      <div>
        <el-button type="primary" @click="saveConfig">确 定</el-button>
        <el-button @click="closeDrawer">取 消</el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script setup lang="ts">
import { SimpleFlowNode, NodeType, TriggerSetting, TRIGGER_TYPES, TriggerTypeEnum } from '../consts'
import { useWatchNode, useDrawer, useNodeName } from '../node'
import HttpRequestParamSetting from './components/HttpRequestParamSetting.vue'

defineOptions({
  name: 'TriggerNodeConfig'
})
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
// 抽屉配置
const { settingVisible, closeDrawer, openDrawer } = useDrawer()
// 当前节点
const currentNode = useWatchNode(props)
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(NodeType.TRIGGER_NODE)
// 触发器表单配置
const formRef = ref() // 表单 Ref
// 表单校验规则
const formRules = reactive({
  type: [{ required: true, message: '触发器类型不能为空', trigger: 'change' }],
  httpRequestSetting: {
    url: [{ required: true, message: '请求地址不能为空', trigger: 'blur' }]
  }
})
// 触发器配置表单数据
const configForm = ref<TriggerSetting>({
  type: TriggerTypeEnum.HTTP_REQUEST,
  httpRequestSetting: {
    url: '',
    header: [],
    body: []
  }
})

/** 保存配置 */
const saveConfig = async () => {
  if (!formRef) return false
  const valid = await formRef.value.validate()
  if (!valid) return false
  const showText = getShowText()
  if (!showText) return false
  currentNode.value.showText = showText
  currentNode.value.triggerSetting = configForm.value
  settingVisible.value = false
  return true
}
/** 获取节点展示内容 */
const getShowText = (): string => {
  let showText = ''
  if (configForm.value.type === TriggerTypeEnum.HTTP_REQUEST) {
    showText = `${configForm.value.httpRequestSetting.url}`
  }
  return showText
}

/** 显示触发器节点配置， 由父组件传过来 */
const showTriggerNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name
  if (node.triggerSetting) {
    configForm.value.type = node.triggerSetting.type
    configForm.value.httpRequestSetting = node.triggerSetting.httpRequestSetting
  }
}

defineExpose({ openDrawer, showTriggerNodeConfig }) // 暴露方法给父组件
</script>

<style lang="scss" scoped></style>
