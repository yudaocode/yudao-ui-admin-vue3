/* stylelint-disable order/properties-order */
<template>
  <div class="add-node-btn-box">
    <div class="add-node-btn">
      <el-popover placement="right-start" v-model="visible" width="auto">
        <div class="add-node-popover-body">
          <a class="add-node-popover-item approver" @click="addType(1)">
            <div class="item-wrapper">
              <span class="iconfont"></span>
            </div>
            <p>审批人</p>
          </a>
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
        </div>
        <template #reference>
          <button class="btn" type="button">
            <span class="iconfont"></span>
          </button>
        </template>
      </el-popover>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
let props = defineProps({
  childNodeP: {
    type: Object,
    default: () => ({})
  }
})
let emits = defineEmits(['update:childNodeP'])
let visible = ref(false)
const addType = (type) => {
  visible.value = false
  if (type != 4) {
    var data
    if (type == 1) {
      data = {
        nodeName: '审核人',
        error: true,
        type: 1,
        settype: 1,
        selectMode: 0,
        selectRange: 0,
        directorLevel: 1,
        examineMode: 1,
        noHanderAction: 1,
        examineEndDirectorLevel: 0,
        childNode: props.childNodeP,
        nodeUserList: []
      }
    } else if (type == 2) {
      data = {
        nodeName: '抄送人',
        type: 2,
        ccSelfSelectFlag: 1,
        childNode: props.childNodeP,
        nodeUserList: []
      }
    }
    emits('update:childNodeP', data)
  } else {
    emits('update:childNodeP', {
      nodeName: '路由',
      type: 4,
      childNode: null,
      conditionNodes: [
        {
          nodeName: '条件1',
          error: true,
          type: 3,
          priorityLevel: 1,
          conditionList: [],
          nodeUserList: [],
          childNode: props.childNodeP
        },
        {
          nodeName: '条件2',
          type: 3,
          priorityLevel: 2,
          conditionList: [],
          nodeUserList: [],
          childNode: null
        }
      ]
    })
  }
}
</script>
<style scoped lang="scss">
.add-node-btn-box {
  width: 240px;
  display: inline-flex;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    margin: auto;
    width: 2px;
    height: 100%;
    background-color: #cacaca;
  }

  .add-node-btn {
    user-select: none;
    width: 240px;
    padding: 20px 0 32px;
    display: flex;
    -webkit-box-pack: center;
    justify-content: center;
    flex-shrink: 0;
    -webkit-box-flex: 1;
    flex-grow: 1;

    .btn {
      outline: none;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      width: 30px;
      height: 30px;
      background: #3296fa;
      border-radius: 50%;
      position: relative;
      border: none;
      line-height: 30px;
      -webkit-transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

      .iconfont {
        color: #fff;
        font-size: 16px;
      }

      &:hover {
        transform: scale(1.3);
        box-shadow: 0 13px 27px 0 rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: none;
        background: #1e83e9;
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
      user-select: none;
      display: inline-block;
      width: 80px;
      height: 80px;
      margin-bottom: 5px;
      background: #fff;
      border: 1px solid #e2e2e2;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);

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
        box-shadow: none;
        background: #eaeaea;
      }

      .iconfont {
        color: inherit;
      }
    }
  }
}
</style>
