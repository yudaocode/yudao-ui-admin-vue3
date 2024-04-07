/* stylelint-disable order/properties-order */
<template>
  <div class="add-node-btn-box">
    <div class="add-node-btn">
      <el-popover placement="right-start" v-model="visible" width="auto">
        <div class="add-node-popover-body">
          <a class="add-node-popover-item approver" @click="addType(1)">
            <div class="item-wrapper">
              <span class="iconfont icon-approve"></span>
            </div>
            <p>审批人</p>
          </a>
          <!--  TODO 暂时去掉未完成
          <a class="add-node-popover-item notifier" @click="addType(2)">
            <div class="item-wrapper">
              <span class="iconfont"></span>
            </div>
            <p>抄送人</p>
          </a>
          <a class="add-node-popover-item condition" @click="addType(4)">
            <div class="item-wrapper">
              <span class="iconfont"></span>
            </div>
            <p>条件分支</p>
          </a>
          -->
          <a class="add-node-popover-item notifier" @click="addType(2)">
            <div class="item-wrapper">
              <span class="iconfont icon-copy"></span>
            </div>
            <p>抄送人</p>
          </a>
          <a class="add-node-popover-item condition" @click="addType(4)">
            <div class="item-wrapper">
              <span class="iconfont icon-exclusive"></span>
            </div>
            <p>条件分支</p>
          </a>
          <a class="add-node-popover-item condition" @click="addType(5)">
            <div class="item-wrapper">
              <span class="iconfont icon-parallel"></span>
            </div>
            <p>并行分支</p>
          </a>
        </div>
        <template #reference>
          <button class="btn" type="button" v-if="showAddButton">
            <span><Icon icon="ep:plus" class="addIcon" :size="14" /></span>
          </button>
        </template>
      </el-popover>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { NodeType } from './consts'
import { ref } from 'vue'
import { generateUUID } from '@/utils'
let props = defineProps({
  childNodeP: {
    type: Object,
    default: () => ({})
  },
  showAddButton:{
    type:Boolean,
    default:true
  }
})
let emits = defineEmits(['update:childNodeP'])
let visible = ref(false)
const addType = (type: number) => {
  visible.value = false
  // 审核节点
  if (type === NodeType.APPROVE_USER_NODE) {
    const data = {
      name: '审核人',
      error: true,
      type: 1,
      // 审批节点配置
      attributes: {
        approveMethod: undefined,
        candidateStrategy: undefined,
        candidateParam: undefined
      },
      childNode: props.childNodeP
    }
    emits('update:childNodeP', data)
  }
  // 抄送节点
  if (type === NodeType.CC_USER_NODE) {
    const data = {
      name: '抄送人',
      type: 2,
      error: true,
      // 抄送节点配置
      attributes: {
        candidateStrategy: undefined,
        candidateParam: undefined
      },
      childNode: props.childNodeP
    }
    emits('update:childNodeP', data)
  }
  // 条件分支
  if (type === NodeType.EXCLUSIVE_NODE) {
    const data = {
      name: '条件分支',
      type: 4,
      id: 'GateWay_' + generateUUID(),
      childNode: props.childNodeP,
      conditionNodes: [
        {
          name: '条件1',
          error: true,
          type: 3,
          priorityLevel: 1,
          conditionList: [],
          childNode: null
        },
        {
          name: '其它情况',
          type: 3,
          priorityLevel: 2,
          conditionList: [],
          childNode: null
        }
      ]
    }
    emits('update:childNodeP', data)
  }
  // 并行分支 fork
  if (type === NodeType.PARALLEL_NODE_FORK) {
    const data = {
      name: '并行分支_FORK',
      type: 5,
      id: 'GateWay_' + generateUUID(),
      conditionNodes: [
        {
          name: '并行1',
          error: true,
          type: 3,
          childNode: null
        },
        {
          name: '并行2',
          type: 3,
          childNode: null
        }
      ],
      childNode: {
        id: 'GateWay_' + generateUUID(),
        name: '并行分支_JOIN',
        type: 6,
        error: true,
        childNode: props.childNodeP,
      }
    }
    emits('update:childNodeP', data)
  }
  // if (type != 4) {
  //   var data
  //   if (type == 1) {
  //     data = {
  //       name: '审核人',
  //       error: true,
  //       type: 1,
  //       // 审批节点配置
  //       attributes : {
  //         approveMethod : undefined,
  //         candidateStrategy: undefined,
  //         candidateParam: undefined
  //       },
  //       childNode: props.childNodeP
  //     }
  //   } else if (type == 2) {
  //     data = {
  //       name: '抄送人',
  //       type: 2,
  //       error: true,
  //        // 抄送节点配置
  //       attributes : {
  //         candidateStrategy: undefined,
  //         candidateParam: undefined
  //       },
  //       childNode: props.childNodeP
  //     }
  //   }
  //   emits('update:childNodeP', data)
  // } else {
  //   emits('update:childNodeP', {
  //     name: '路由',
  //     type: 4,
  //     id : 'GateWay_'+ generateUUID(),
  //     childNode: props.childNodeP,
  //     conditionNodes: [
  //       {
  //         name: '条件1',
  //         error: true,
  //         type: 3,
  //         priorityLevel: 1,
  //         conditionList: [],
  //         childNode: null
  //       },
  //       {
  //         name: '其它情况',
  //         type: 3,
  //         priorityLevel: 2,
  //         conditionList: [],
  //         childNode: null
  //       }
  //     ]
  //   })
  // }
}
</script>
<style scoped lang="scss">
.add-node-btn-box {
  position: relative;
  display: inline-flex;
  width: 240px;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    width: 2px;
    height: 100%;
    margin: auto;
    background-color: #cacaca;
    content: '';
  }

  .add-node-btn {
    display: flex;
    width: 240px;
    padding: 20px 0 32px;
    justify-content: center;
    flex-shrink: 0;
    -webkit-box-flex: 1;
    -webkit-box-pack: center;
    user-select: none;
    flex-grow: 1;

    .btn {
      position: relative;
      width: 30px;
      height: 30px;
      line-height: 30px;
      background: #3296fa;
      border: none;
      border-radius: 50%;
      outline: none;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      -webkit-transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

      .addIcon {
        line-height: 30px;
        color: #fff;
      }

      &:hover {
        transform: scale(1.3);
        box-shadow: 0 13px 27px 0 rgba(0, 0, 0, 0.1);
      }

      &:active {
        background: #1e83e9;
        transform: none;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.add-node-popover-body {
  display: flex;

  .add-node-popover-item {
    margin-right: 10px;
    cursor: pointer;
    text-align: center;
    flex: 1;
    color: #191f25 !important;

    .item-wrapper {
      display: inline-block;
      width: 80px;
      height: 80px;
      margin-bottom: 5px;
      background: #fff;
      border: 1px solid #e2e2e2;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      user-select: none;

      .iconfont {
        font-size: 35px;
        line-height: 80px;
      }
    }

    &.approver {
      .item-wrapper {
        color: #ff943e;
      }
    }

    &.notifier {
      .item-wrapper {
        color: #3296fa;
      }
    }

    &.condition {
      .item-wrapper {
        color: #15bc83;
      }
    }

    &:hover {
      .item-wrapper {
        background: #3296fa;
        box-shadow: 0 10px 20px 0 rgba(50, 150, 250, 0.4);
      }

      .iconfont {
        color: #fff;
      }
    }

    &:active {
      .item-wrapper {
        background: #eaeaea;
        box-shadow: none;
      }

      .iconfont {
        color: inherit;
      }
    }
  }
}
</style>
