<template>
  <div class="p-20px">
    <el-timeline>
      <el-timeline-item
        v-for="(log, index) in logDataList"
        :key="index"
        :timestamp="formatDate(log.createTime!)"
        placement="top"
      >
        <div class="el-timeline-right-content">
          <el-row>
            <el-col :span="24" class="mb-10px">
              =======================
              <el-tag class="mr-10px" type="success">{{ log.creatorName }}</el-tag>
              <span>{{ log.title }}</span>
              =======================
            </el-col>
            <!-- 先处理一下有几行-->
            <template v-for="colNum in log.colSize" :key="colNum + 'col'">
              <el-col :span="24" class="mb-10px">
                <!-- 处理每一行-->
                <template
                  v-for="(tagVal, index2) in log.tagsContentList.slice(
                    (colNum - 1) * 3,
                    3 * colNum
                  )"
                  :key="index2"
                >
                  <el-tag class="mx-10px"> {{ tagVal }}</el-tag>
                  <span>{{ log.contentStrList[index2] }}</span>
                </template>
              </el-col>
            </template>
          </el-row>
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
import { OperateLogV2VO } from '@/api/system/operatelog'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getDictObj } from '@/utils/dict'
import { ElTag } from 'element-plus'

const props = defineProps<{
  logList: OperateLogV2VO[] // 操作日志列表
}>()
defineOptions({ name: 'OperateLogV2' })

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
const logDataList = ref<OperateLogV2VO[]>([]) // 操作日志列表
// 提取 tag 所需内容和位置
const renderTags = (content: string) => {
  let newStr = unref(content).slice() // 去掉引用
  newStr = newStr.replaceAll('【】', '【空】').replaceAll('；', '') // 处理掉分号 特殊：处理一下空的情况
  const regex = /【([^【】]+)】/g
  const fg = '|' // 原始位置替换符号
  let match: any[] | null
  let matchStr: string[] = []
  let oldStr: string[] = []
  while ((match = regex.exec(newStr)) !== null) {
    matchStr.push(match[1]) // 提取值
    oldStr.push(match[0]) // 原值
  }
  // 为什么重新循环不放在 while 中一起是因为替换重新赋值过后 match 值就不准确了
  oldStr.forEach((item) => {
    newStr = newStr.replace(item, fg)
  })
  return [newStr.split(fg), matchStr]
}
const initLog = () => {
  logDataList.value = props.logList.map((logItem) => {
    const keyValue = renderTags(logItem.content)
    // 挂载数据
    logItem.contentStrList = keyValue[0]
    if (keyValue[0][0] === '从') {
      logItem.title = logItem.name
    } else {
      logItem.title = keyValue[0][0]
      logItem.contentStrList.splice(0, 1)
    }
    logItem.colSize = keyValue[0].length / 3 // 变更记录行数
    logItem.tagsContentList = keyValue[1]
    return logItem
  })
}
watch(
  () => props.logList.length,
  (newObj) => {
    if (newObj) {
      initLog()
      console.log(logDataList.value)
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<style lang="scss" scoped>
// 时间线样式调整
:deep(.el-timeline) {
  margin: 10px 0 0 160px;

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
