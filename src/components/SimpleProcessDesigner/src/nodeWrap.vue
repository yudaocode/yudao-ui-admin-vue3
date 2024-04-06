<!-- eslint-disable vue/no-mutating-props -->
<!--
 * @Date: 2022-09-21 14:41:53
 * @LastEditors: StavinLi 495727881@qq.com
 * @LastEditTime: 2023-05-24 15:20:24
 * @FilePath: /Workflow-Vue3/src/components/nodeWrap.vue
-->
<template>
     <div class="node-wrap" v-if="nodeConfig.type < 3">
      <div class="node-wrap-box" :class="(nodeConfig.type == 0 ? 'start-node ' : '') +(isTried && nodeConfig.error ? 'active error' : '')">
          <div class="title" :style="`background: rgb(${bgColors[nodeConfig.type]});`">
            <span v-if="nodeConfig.type == 0">{{ nodeConfig.nodeName }}</span>
            <template v-else>
              <span class="iconfont">{{nodeConfig.type == 1?'':''}}</span>
              <input
                v-if="isInput"
                type="text"
                class="ant-input editable-title-input"
                @blur="blurEvent()"
                @focus="$event.currentTarget.select()"
                v-focus
                v-model="nodeConfig.nodeName"
                :placeholder="defaultText"
              />
              <span v-else class="editable-title" @click="clickEvent()">{{ nodeConfig.nodeName }}</span>
              <i class="anticon anticon-close close" @click="delNode"></i>
            </template>
          </div>
          <div class="content" @click="setPerson">
            <div class="text">
                <span class="placeholder" v-if="!showText">请选择{{defaultText}}</span>
                {{showText}}
            </div>
            <i class="anticon anticon-right arrow"></i>
          </div>
          <div class="error_tip" v-if="isTried && nodeConfig.error">
            <i class="anticon anticon-exclamation-circle"></i>
          </div>
      </div>
      <addNode v-model:childNodeP="nodeConfig.childNode" />
    </div>
    <div class="branch-wrap" v-if="nodeConfig.type == 4">
    <div class="branch-box-wrap">
      <div class="branch-box">
        <button class="add-branch" @click="addTerm">添加条件</button>
        <div class="col-box" v-for="(item, index) in nodeConfig.conditionNodes" :key="index">
          <div class="condition-node">
            <div class="condition-node-box">
              <div class="auto-judge" :class="isTried && item.error ? 'error active' : ''">
                <div class="sort-left" v-if="index != 0" @click="arrTransfer(index, -1)">&lt;</div>
                <div class="title-wrapper">
                  <input
                    v-if="isInputList[index]"
                    type="text"
                    class="ant-input editable-title-input"
                    @blur="blurEvent(index)"
                    @focus="$event.currentTarget.select()"
                    v-model="item.nodeName"
                  />
                  <span v-else class="editable-title" @click="clickEvent(index)">{{ item.nodeName }}</span>
                  <span class="priority-title" @click="setPerson(item.priorityLevel)">优先级{{ item.priorityLevel }}</span>
                  <i class="anticon anticon-close close" @click="delTerm(index)"></i>
                </div>
                <div class="sort-right" v-if="index != nodeConfig.conditionNodes.length - 1" @click="arrTransfer(index)">&gt;</div>
                <div class="content" @click="setPerson(item.priorityLevel)">{{ conditionStr(nodeConfig, index) }}</div>
                <div class="error_tip" v-if="isTried && item.error">
                    <i class="anticon anticon-exclamation-circle"></i>
                </div>
              </div>
              <addNode v-model:childNodeP="item.childNode" />
            </div>
          </div>
          <nodeWrap v-if="item.childNode" v-model:nodeConfig="item.childNode" />
          <template v-if="index == 0">
            <div class="top-left-cover-line"></div>
            <div class="bottom-left-cover-line"></div>
          </template>
          <template v-if="index == nodeConfig.conditionNodes.length - 1">
            <div class="top-right-cover-line"></div>
            <div class="bottom-right-cover-line"></div>
          </template>
        </div>
      </div>
      <addNode v-model:childNodeP="nodeConfig.childNode" />
    </div>
  </div>
    <nodeWrap v-if="nodeConfig.childNode" v-model:nodeConfig="nodeConfig.childNode" />
</template>
<script  setup>
import addNode from './addNode.vue'
import { onMounted, ref, watch, getCurrentInstance, computed } from 'vue'
import {
  arrToStr,
  conditionStr,
  setApproverStr,
  copyerStr,
  bgColors,
  placeholderList
} from './util'
import { useWorkFlowStoreWithOut } from '@/store/modules/simpleWorkflow'
let _uid = getCurrentInstance().uid

let props = defineProps({
  nodeConfig: {
    type: Object,
    default: () => ({})
  },
  flowPermission: {
    type: Object,
    // eslint-disable-next-line vue/require-valid-default-prop
    default: () => []
  }
})

let defaultText = computed(() => {
  return placeholderList[props.nodeConfig.type]
})
let showText = computed(() => {
  if (props.nodeConfig.type == 0) return arrToStr(props.flowPermission) || '所有人'
  if (props.nodeConfig.type == 1) return setApproverStr(props.nodeConfig)
  return copyerStr(props.nodeConfig)
})

let isInputList = ref([])
let isInput = ref(false)
const resetConditionNodesErr = () => {
  for (var i = 0; i < props.nodeConfig.conditionNodes.length; i++) {
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.conditionNodes[i].error =
      conditionStr(props.nodeConfig, i) == '请设置条件' &&
      i != props.nodeConfig.conditionNodes.length - 1
  }
}
onMounted(() => {
  if (props.nodeConfig.type == 1) {
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.error = !setApproverStr(props.nodeConfig)
  } else if (props.nodeConfig.type == 2) {
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.error = !copyerStr(props.nodeConfig)
  } else if (props.nodeConfig.type == 4) {
    resetConditionNodesErr()
  }
})
let emits = defineEmits(['update:flowPermission', 'update:nodeConfig'])
let store = useWorkFlowStoreWithOut()
let {
  setPromoter,
  setApprover,
  setCopyer,
  setCondition,
  setFlowPermission,
  setApproverConfig,
  setCopyerConfig,
  setConditionsConfig
} = store
let isTried = computed(() => store.isTried)
let flowPermission1 = computed(() => store.flowPermission1)
let approverConfig1 = computed(() => store.approverConfig1)
let copyerConfig1 = computed(() => store.copyerConfig1)
let conditionsConfig1 = computed(() => store.conditionsConfig1)
watch(flowPermission1, (flow) => {
  if (flow.flag && flow.id === _uid) {
    emits('update:flowPermission', flow.value)
  }
})
watch(approverConfig1, (approver) => {
  if (approver.flag && approver.id === _uid) {
    emits('update:nodeConfig', approver.value)
  }
})
watch(copyerConfig1, (copyer) => {
  if (copyer.flag && copyer.id === _uid) {
    emits('update:nodeConfig', copyer.value)
  }
})
watch(conditionsConfig1, (condition) => {
  if (condition.flag && condition.id === _uid) {
    emits('update:nodeConfig', condition.value)
  }
})

const clickEvent = (index) => {
  if (index || index === 0) {
    isInputList.value[index] = true
  } else {
    isInput.value = true
  }
}
const blurEvent = (index) => {
  if (index || index === 0) {
    isInputList.value[index] = false
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.conditionNodes[index].nodeName =
      props.nodeConfig.conditionNodes[index].nodeName || '条件'
  } else {
    isInput.value = false
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.nodeName = props.nodeConfig.nodeName || defaultText
  }
}
const delNode = () => {
  emits('update:nodeConfig', props.nodeConfig.childNode)
}
const addTerm = () => {
  let len = props.nodeConfig.conditionNodes.length + 1
  // eslint-disable-next-line vue/no-mutating-props
  props.nodeConfig.conditionNodes.push({
    nodeName: '条件' + len,
    type: 3,
    priorityLevel: len,
    conditionList: [],
    nodeUserList: [],
    childNode: null
  })
  resetConditionNodesErr()
  emits('update:nodeConfig', props.nodeConfig)
}
const delTerm = (index) => {
  // eslint-disable-next-line vue/no-mutating-props
  props.nodeConfig.conditionNodes.splice(index, 1)
  props.nodeConfig.conditionNodes.map((item, index) => {
    item.priorityLevel = index + 1
    item.nodeName = `条件${index + 1}`
  })
  resetConditionNodesErr()
  emits('update:nodeConfig', props.nodeConfig)
  if (props.nodeConfig.conditionNodes.length == 1) {
    if (props.nodeConfig.childNode) {
      if (props.nodeConfig.conditionNodes[0].childNode) {
        reData(props.nodeConfig.conditionNodes[0].childNode, props.nodeConfig.childNode)
      } else {
        // eslint-disable-next-line vue/no-mutating-props
        props.nodeConfig.conditionNodes[0].childNode = props.nodeConfig.childNode
      }
    }
    emits('update:nodeConfig', props.nodeConfig.conditionNodes[0].childNode)
  }
}
const reData = (data, addData) => {
  if (!data.childNode) {
    data.childNode = addData
  } else {
    reData(data.childNode, addData)
  }
}
const setPerson = (priorityLevel) => {
  var { type } = props.nodeConfig
  if (type == 0) {
    setPromoter(true)
    setFlowPermission({
      value: props.flowPermission,
      flag: false,
      id: _uid
    })
  } else if (type == 1) {
    setApprover(true)
    setApproverConfig({
      value: {
        ...JSON.parse(JSON.stringify(props.nodeConfig)),
        ...{ settype: props.nodeConfig.settype ? props.nodeConfig.settype : 1 }
      },
      flag: false,
      id: _uid
    })
  } else if (type == 2) {
    setCopyer(true)
    setCopyerConfig({
      value: JSON.parse(JSON.stringify(props.nodeConfig)),
      flag: false,
      id: _uid
    })
  } else {
    setCondition(true)
    setConditionsConfig({
      value: JSON.parse(JSON.stringify(props.nodeConfig)),
      priorityLevel,
      flag: false,
      id: _uid
    })
  }
}
const arrTransfer = (index, type = 1) => {
  //向左-1,向右1
  // eslint-disable-next-line vue/no-mutating-props
  props.nodeConfig.conditionNodes[index] = props.nodeConfig.conditionNodes.splice(
    index + type,
    1,
    props.nodeConfig.conditionNodes[index]
  )[0]
  props.nodeConfig.conditionNodes.map((item, index) => {
    item.priorityLevel = index + 1
  })
  resetConditionNodesErr()
  emits('update:nodeConfig', props.nodeConfig)
}
</script>
