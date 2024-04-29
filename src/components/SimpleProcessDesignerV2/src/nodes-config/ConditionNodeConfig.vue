<template>
  <el-drawer
    :append-to-body="true"
    v-model="settingVisible"
    :show-close="false"
    :size="550"
    :before-close="saveConfig"
   >
   <template #header>
      <div class="w-full flex flex-col">
        <div class="mb-2 text-size-2xl">{{ currentNode.name }}</div>
        <el-divider />
      </div>
   </template>
    <div> 
      <div class="mb-3 text-size-sm" v-if="currentNode.attributes.defaultFlow">其它条件不满足进入此分支（该分支不可编辑和删除）</div>
      <div v-else>
          <el-form label-position="top">
            <el-form-item label="条件类型" prop="conditionType">
              <el-radio-group
                v-model="currentNode.attributes.conditionType"
                @change="changeConditionType"
              >
                <el-radio
                  v-for="(dict, index) in CONDITION_CONFIG_TYPES"
                  :key="index"
                  :value="dict.value"
                  :label="dict.value"
                >
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
              
            <el-form-item
              v-if="currentNode.attributes.conditionType === 1"
              label="条件表达式"
              prop="conditionExpression"
            >
              <el-input
                type="textarea"
                v-model="currentNode.attributes.conditionExpression"
                clearable
                style="width: 100%"
              />
            </el-form-item>
            <!-- <el-form-item
              v-if="currentNode.attributes.conditionType === 1"
              label="条件规则"
              prop="conditionExpression"
            >
              <span class="text-red-400">待实现</span>
            </el-form-item> -->
          </el-form>
      </div>    
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
import { SimpleFlowNode, CONDITION_CONFIG_TYPES } from '../consts'
defineOptions({
  name: 'ConditionNode'
})
const props = defineProps({
  conditionNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  }
})
const settingVisible = ref(false)
const open = () => {
  settingVisible.value = true
}

watch(() => props.conditionNode, (newValue) => {  
  currentNode.value = newValue;  
}); 

const currentNode = ref<SimpleFlowNode>(props.conditionNode)
// TODO nodeInfo 测试
defineExpose({ open, nodeInfo: currentNode }) // 提供 open 方法，用于打开弹窗

// 关闭
const closeDrawer = () => {
  settingVisible.value = false
}
// 保存配置
const saveConfig = () => {
  if (!currentNode.value.attributes.defaultFlow) {
    currentNode.value.showText = getShowText();
  }
  settingVisible.value = false
}
const getShowText = () : string => {
  let showText ='';
  // if (currentNode.value.attributes.conditionType === 1) {
  //   showText = '待实现'
  // } 
  if (currentNode.value.attributes.conditionType === 1) {
    if (currentNode.value.attributes.conditionExpression) {
      showText = `表达式：${currentNode.value.attributes.conditionExpression}`
    }
  }
  return showText
}
// 改变条件配置方式
const changeConditionType = () => {

}
</script>

<style lang="scss" scoped>
::v-deep(.el-divider--horizontal) {
  display: block;
  height: 1px;
  margin: 0;
  border-top: 1px var(--el-border-color) var(--el-border-style);
}
</style>
