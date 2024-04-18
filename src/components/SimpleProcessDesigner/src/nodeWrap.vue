<!-- eslint-disable vue/no-mutating-props -->
<!--
 * @Date: 2022-09-21 14:41:53
 * @LastEditors: StavinLi 495727881@qq.com
 * @LastEditTime: 2023-05-24 15:20:24
 * @FilePath: /Workflow-Vue3/src/components/nodeWrap.vue
-->
<template>
  <div class="node-wrap" v-if="nodeConfig.type < 3">
    <div class="node-wrap-box" :class="isTried && nodeConfig.error ? 'active error' : ''">
      <div class="title" :style="`background: rgb(${bgColors[nodeConfig.type]});`">
        <span v-if="nodeConfig.type == 0">发起人</span>
        <template v-else>
          <span
            class="iconfont"
            :class="nodeConfig.type === NodeType.APPROVE_USER_NODE ? 'icon-approve' : 'icon-copy'"
          >
          </span>
          <input
            v-if="isInput"
            type="text"
            class="ant-input editable-title-input"
            @blur="blurEvent(-1)"
            @focus="$event.currentTarget?.select()"
            v-mountedFocus
            v-model="nodeConfig.name"
            :placeholder="defaultText"
          />
          <span v-else class="editable-title" @click="clickEvent(-1)">{{ nodeConfig.name }}</span>
          <i class="anticon anticon-close close" @click="delNode"></i>
        </template>
      </div>
      <div class="content" @click="setPerson">
        <div class="text">
          <span class="placeholder" v-if="!showText">请选择{{ defaultText }}</span>
          <span v-html="showText" class="ellipsis-text" v-else></span>
        </div>
        <!-- <div class="icon-box">
          <i class="anticon anticon-edit" @click="editNode"></i>
        </div> -->
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
        <button class="add-branch" @click="addTerm(nodeConfig.type)">添加条件</button>
        <div class="col-box" v-for="(item, index) in nodeConfig.conditionNodes" :key="index">
          <div class="condition-node">
            <div class="condition-node-box">
              <div class="title-wrapper" :style="`background: rgb(${bgColors[nodeConfig.type]});`">
                <input
                  v-if="isInputList[index]"
                  type="text"
                  class="ant-input editable-title-input"
                  @blur="blurEvent(index)"
                  @focus="$event.currentTarget?.select()"
                  v-mountedFocus
                  v-model="item.name"
                />
                <span v-else class="editable-title" @click="clickEvent(index)">{{
                  item.name
                }}</span>
                <!-- <span class="priority-title" @click="setPerson(item.priorityLevel)"
                      >优先级{{ index + 1 }}</span
                    > -->
                <i
                  class="anticon anticon-close close"
                  @click="delTerm(nodeConfig.type,index)"
                  v-if="nodeConfig.conditionNodes && index != nodeConfig.conditionNodes?.length - 1"
                ></i>
              </div>
              <div class="auto-judge" :class="isTried && item.error ? 'error active' : ''">
                <!-- <div class="sort-left" v-if="index != 0" @click="arrTransfer(index, -1)">&lt;</div> -->

                <!-- <div
                  class="sort-right"
                  v-if="index != nodeConfig.conditionNodes.length - 1"
                  @click="arrTransfer(index)"
                  >&gt;</div
                > -->
                <!-- <div class="content" @click="setPerson(item.priorityLevel)">{{
                  conditionStr(nodeConfig, index)
                }}</div> -->
                <div class="content">{{ conditionStr(nodeConfig, index) }}</div>
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
  <div class="branch-wrap" v-if="nodeConfig.type == 5">
    <div class="branch-box-wrap">
      <div class="branch-box">
        <button class="add-branch" @click="addTerm(nodeConfig.type)">添加分支</button>
        <div class="col-box" v-for="(item, index) in nodeConfig.conditionNodes" :key="index">
          <div class="condition-node">
            <div class="condition-node-box">
              <div class="title-wrapper" :style="`background: rgb(${bgColors[nodeConfig.type]});`">
                <input
                  v-if="isInputList[index]"
                  type="text"
                  class="ant-input editable-title-input"
                  @blur="blurEvent(index)"
                  @focus="$event.currentTarget?.select()"
                  v-mountedFocus
                  v-model="item.name"
                />
                <span v-else class="editable-title" @click="clickEvent(index)">{{
                  item.name
                }}</span>
                <i class="anticon anticon-close close" @click="delTerm(nodeConfig.type, index)"></i>
              </div>
              <div class="auto-judge" :class="isTried && item.error ? 'error active' : ''">
                <div class="content">并行执行</div>
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
          <template v-if="index === nodeConfig.conditionNodes.length - 1">
            <div class="top-right-cover-line"></div>
            <div class="bottom-right-cover-line"></div>
          </template>
        </div>
      </div>
      <addNode v-model:childNodeP="nodeConfig.childNode" :show-add-button="false" />
    </div>
  </div>
  <div class="branch-wrap" v-if="nodeConfig.type == 7">
    <div class="branch-box-wrap">
      <div class="branch-box">
        <button class="add-branch" @click="addTerm(nodeConfig.type)">添加分支</button>
        <div class="col-box" v-for="(item, index) in nodeConfig.conditionNodes" :key="index">
          <div class="condition-node">
            <div class="condition-node-box">
              <div class="title-wrapper" :style="`background: rgb(${bgColors[nodeConfig.type]});`">
                <input
                  v-if="isInputList[index]"
                  type="text"
                  class="ant-input editable-title-input"
                  @blur="blurEvent(index)"
                  @focus="$event.currentTarget?.select()"
                  v-mountedFocus
                  v-model="item.name"
                />
                <span v-else class="editable-title" @click="clickEvent(index)">
                  {{ item.name }}
                </span>
                 <i
                  class="anticon anticon-close close"
                  @click="delTerm(nodeConfig.type,index)"
                  v-if="index != nodeConfig.conditionNodes?.length - 1"
                  ></i>
              </div>
              <div class="auto-judge" :class="isTried && item.error ? 'error active' : ''">
                <div class="content">{{ conditionStr(nodeConfig, index) }}</div>
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
      <addNode v-model:childNodeP="nodeConfig.childNode" :show-add-button="false" />
    </div>
  </div>
  <div class="node-wrap" v-if="nodeConfig.type === NodeType.PARALLEL_NODE_JOIN || nodeConfig.type === NodeType.INCLUSIVE_NODE_JOIN">
    <div class="node-wrap-box">
      <div class="content">
        <div class="text">聚合</div>
      </div>
    </div>
    <addNode v-model:childNodeP="nodeConfig.childNode"  />
  </div>
  <nodeWrap v-if="nodeConfig.childNode" v-model:nodeConfig="nodeConfig.childNode" />
</template>
<script lang="ts" setup>
import addNode from './addNode.vue'
import { onMounted, ref, watch, getCurrentInstance, computed } from 'vue'
import {
  conditionStr,
  setApproverStr,
  copyerStr,
  bgColors,
  placeholderList,
  getApproverShowText
} from './util'
import { WorkFlowNode, NodeType } from './consts'
import { useWorkFlowStoreWithOut } from '@/store/modules/bpm/simpleWorkflow'
let _uid = getCurrentInstance().uid
import { generateUUID } from '@/utils'
let props = defineProps({
  nodeConfig: {
    type: Object as () => WorkFlowNode,
    default: () => ({}) as WorkFlowNode
  }
})

let defaultText = computed(() => {
  return placeholderList[props.nodeConfig.type]
})
const isInputList = ref<boolean[]>([])
const isInput = ref<boolean>(false)
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
let emits = defineEmits(['update:nodeConfig'])
let store = useWorkFlowStoreWithOut()
let {
  setApproverDrawer,
  setCopyerDrawer,
  // setCondition,
  setCopyerConfig,
  // setConditionsConfig,
  setUserTaskConfig
} = store
// ???
const isTried = computed(() => store.isTried)
// 审批节点的配置
const userTaskConfig = computed(() => store.userTaskConfig)
// 抄送节点的配置
const copyerConfig = computed(() => store.copyerConfig)
// let conditionsConfig1 = computed(() => store.conditionsConfig1)
const showText = computed(() => {
  if (props.nodeConfig.type == 0) return '发起人'
  if (props.nodeConfig.type == 1) {
    if (props.nodeConfig.attributes) {
      return getApproverShowText(
        props.nodeConfig.attributes.approveMethod,
        props.nodeConfig.attributes.candidateStrategy
      )
    } else {
      return ''
    }
  }
  if (props.nodeConfig.type === 2) {
    if (props.nodeConfig.attributes) {
      return copyerStr(props.nodeConfig.attributes.candidateStrategy)
    } else {
      return ''
    }
  }
  return ''
})
watch(userTaskConfig, (approver) => {
  if (approver.flag && approver.id === _uid) {
    emits('update:nodeConfig', approver.value)
  }
})
watch(copyerConfig, (copyer) => {
  console.log('copyer', copyer)
  if (copyer.flag && copyer.id === _uid) {
    console.log('copyer id is equal', copyer)
    emits('update:nodeConfig', copyer.value)
  }
})

// watch(conditionsConfig1, (condition) => {
//   if (condition.flag && condition.id === _uid) {
//     emits('update:nodeConfig', condition.value)
//   }
// })

const clickEvent = (index) => {
  if (index >= 0) {
    isInputList.value[index] = true
  } else {
    isInput.value = true
  }
}

const blurEvent = (index) => {
  if (index >= 0) {
    isInputList.value[index] = false
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.conditionNodes[index].name =
      props.nodeConfig.conditionNodes[index].name || '条件'
  } else {
    isInput.value = false
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.name = props.nodeConfig.name || defaultText
  }
}
const delNode = () => {
  emits('update:nodeConfig', props.nodeConfig.childNode)
}
const addTerm = (type:number) => {
  const len = props.nodeConfig.conditionNodes.length
  let lastIndex = props.nodeConfig.conditionNodes.length - 1
  let nodeName = '分支' + len
  if(type === NodeType.PARALLEL_NODE_FORK) {
    nodeName = '并行' + (len+1);
    lastIndex = props.nodeConfig.conditionNodes.length;
  }
  const conditionData = {
    id: 'SequenceFlow'+ generateUUID(),
    name: nodeName,
    type: NodeType.CONDITION_NODE,
    childNode: undefined,
    conditionNodes:[],
    attributes : undefined
  };
  // eslint-disable-next-line vue/no-mutating-props
  props.nodeConfig.conditionNodes.splice(lastIndex, 0, conditionData)
  resetConditionNodesErr()
  emits('update:nodeConfig', props.nodeConfig)
}
const delTerm = (nodeType: number, index: number) => {
  if (props.nodeConfig.conditionNodes) {
    // eslint-disable-next-line vue/no-mutating-props
    props.nodeConfig.conditionNodes.splice(index, 1)
    if (nodeType === NodeType.PARALLEL_NODE_FORK) {
      props.nodeConfig.conditionNodes.map((item, index) => {
          item.name = `并行${index + 1}`
      })
    } else {
      props.nodeConfig.conditionNodes.map((item, index) => {
      // item.priorityLevel = index + 1
      if (index !== props.nodeConfig.conditionNodes.length - 1) {
        item.name = `分支${index + 1}`
      }
    })
    }
   
    resetConditionNodesErr()
    emits('update:nodeConfig', props.nodeConfig)
    if (props.nodeConfig.conditionNodes.length == 1) {
      if (nodeType === NodeType.PARALLEL_NODE_FORK || nodeType === NodeType.INCLUSIVE_NODE_FORK) {
        const joinNode = props.nodeConfig.childNode;
        if (joinNode?.childNode) {
          if (props.nodeConfig.conditionNodes[0].childNode) {
            reData(props.nodeConfig.conditionNodes[0].childNode, joinNode?.childNode)
          } else {
            // eslint-disable-next-line vue/no-mutating-props
            props.nodeConfig.conditionNodes[0].childNode = joinNode?.childNode
          }
        }
        emits('update:nodeConfig', props.nodeConfig.conditionNodes[0].childNode)
      } else {
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
  console.log('priorityLevel', priorityLevel)
  const { type } = props.nodeConfig
  console.log('type', type)
  if (type == 0) {
    // setPromoter(true)
  } else if (type == 1) {
    setApproverDrawer(true)
    // if (_uid === userTaskConfig.value.id) {
    //   showText = userTaskConfig.value.showText
    // }
    setUserTaskConfig({
      value: {
        ...JSON.parse(JSON.stringify(props.nodeConfig)),
        id: 'Activity_' + _uid
      },
      flag: false,
      id: _uid
    })
  } else if (type == 2) {
    setCopyerDrawer(true)
    setCopyerConfig({
      value: {
        ...JSON.parse(JSON.stringify(props.nodeConfig)),
        id: 'Activity_' + _uid
      },
      flag: false,
      id: _uid
    })
  } else {
    // setCondition(true)
    // setConditionsConfig({
    //   value: {
    //     ...JSON.parse(JSON.stringify(props.nodeConfig)),
    //     id: 'Gateway_' + _uid
    //   },
    //   priorityLevel,
    //   flag: false,
    //   id: _uid
    // })
  }
}
// const arrTransfer = (index, type = 1) => {
//   //向左-1,向右1
//   // eslint-disable-next-line vue/no-mutating-props
//   props.nodeConfig.conditionNodes[index] = props.nodeConfig.conditionNodes.splice(
//     index + type,
//     1,
//     props.nodeConfig.conditionNodes[index]
//   )[0]
//   props.nodeConfig.conditionNodes.map((item, index) => {
//     item.priorityLevel = index + 1
//   })
//   resetConditionNodesErr()
//   emits('update:nodeConfig', props.nodeConfig)
// }
</script>
<style lang="scss" scoped>
.ellipsis-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.start-event-node {
  color: #191f2566;
  text-align: left;
  border-radius: 50%;
}

.start-event-node-circle {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  // margin: auto;
  // background: #dbdcdc;
  font-size: 16px;
  color: #f8f8fa;
  background-image: linear-gradient(90deg, #ff6a00, #f78b3e), linear-gradient(#ff6a00, #ff6a00);
  border-radius: 50%;
}

.start-event-node-text {
  margin-top: 5px;
  font-size: 14px;
  text-align: center;
}
</style>
