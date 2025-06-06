<!-- 某个记录的操作日志列表，目前主要用于 CRM 客户、商机等详情界面 -->
<template>
  <div class="pt-20px">
    <el-timeline>
      <el-timeline-item
        v-for="(log, index) in logList"
        :key="index"
        :timestamp="formatDate(log.createTime)"
        placement="top"
      >
        <div class="el-timeline-right-content">
          <el-tag class="mr-10px" type="success">{{ log.userName }}</el-tag>
          {{ log.action }}
        </div>
        <template #dot>
          <span :style="{ backgroundColor: getUserTypeColor(log.userType) }" class="dot-node-style">
            {{ getDictLabel(DICT_TYPE.USER_TYPE, log.userType)[0] }}
          </span>
        </template>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script lang="ts" setup>
import { OperateLogVO } from '@/api/system/operatelog'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getDictObj } from '@/utils/dict'
import { ElTag } from 'element-plus'

defineOptions({ name: 'OperateLogV2' })

interface Props {
  logList: OperateLogVO[] // 操作日志列表
}

withDefaults(defineProps<Props>(), {
  logList: () => []
})

/** 获得 userType 颜色 */
const getUserTypeColor = (type: number) => {
  const dict = getDictObj(DICT_TYPE.USER_TYPE, type)
  switch (dict?.colorType) {
    case 'success':
      return '#67C23A'
    case 'info':
      return '#909399'
    case 'warning':
      return '#E6A23C'
    case 'danger':
      return '#F56C6C'
  }
  return '#409EFF'
}
</script>

<style lang="scss" scoped>
// 时间线样式调整
:deep(.el-timeline) {
  margin: 10px 0 0 110px;

  .el-timeline-item__wrapper {
    position: relative;
    top: -20px;

    .el-timeline-item__timestamp {
      position: absolute !important;
      top: 10px;
      left: -150px;
    }
  }

  .el-timeline-right-content {
    display: flex;
    align-items: center;
    min-height: 30px;
    padding: 10px;
    background-color: #fff;

    &::before {
      position: absolute;
      top: 10px;
      left: 13px; /* 将伪元素水平居中 */
      border-color: transparent #fff transparent transparent; /* 尖角颜色，左侧朝向 */
      border-style: solid;
      border-width: 8px; /* 调整尖角大小 */
      content: ''; /* 必须设置 content 属性 */
    }
  }
}

.dot-node-style {
  position: absolute;
  left: -5px;
  display: flex;
  width: 20px;
  height: 20px;
  font-size: 10px;
  color: #fff;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
}
</style>
