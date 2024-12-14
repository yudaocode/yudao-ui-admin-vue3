<template>
  <ContentWrap>
    <el-tabs>
      <el-tab-pane label="基础通信 Topic">
        <Table
          :columns="basicColumn"
          :data="basicData"
          :span-method="createSpanMethod(basicData)"
          align="left"
          headerAlign="left"
          border="true"
        />
      </el-tab-pane>
      <el-tab-pane label="物模型通信 Topic">
        <Table
          :columns="functionColumn"
          :data="functionData"
          :span-method="createSpanMethod(functionData)"
          align="left"
          headerAlign="left"
          border="true"
        />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product/product'

const props = defineProps<{ product: ProductVO }>()

// TODO 芋艿：不确定未来会不会改，所以先写死

// 基础通信 Topic 列
const basicColumn = reactive([
  { label: '功能', field: 'function', width: 150 },
  { label: 'Topic 类', field: 'topicClass', width: 800 },
  { label: '操作权限', field: 'operationPermission', width: 100 },
  { label: '描述', field: 'description' }
])

// 基础通信 Topic 数据
const basicData = computed(() => {
  if (!props.product || !props.product.productKey) return []
  return [
    {
      function: 'OTA 升级',
      topicClass: `/ota/device/inform/${props.product.productKey}/\${deviceName}`,
      operationPermission: '发布',
      description: '设备上报固件升级信息'
    },
    {
      function: 'OTA 升级',
      topicClass: `/ota/device/upgrade/${props.product.productKey}/\${deviceName}`,
      operationPermission: '订阅',
      description: '固件升级信息下行'
    },
    {
      function: 'OTA 升级',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/ota/firmware/get`,
      operationPermission: '发布',
      description: '设备上报固件升级进度'
    },
    {
      function: 'OTA 升级',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/ota/firmware/get`,
      operationPermission: '发布',
      description: '设备主动拉取固件升级信息'
    },
    {
      function: '设备标签',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/deviceinfo/update`,
      operationPermission: '发布',
      description: '设备上报标签数据'
    },
    {
      function: '设备标签',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/deviceinfo/update_reply`,
      operationPermission: '订阅',
      description: '云端响应标签上报'
    },
    {
      function: '设备标签',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/deviceinfo/delete`,
      operationPermission: '订阅',
      description: '设备删除标签信息'
    },
    {
      function: '设备标签',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/deviceinfo/delete_reply`,
      operationPermission: '订阅',
      description: '云端响应标签删除'
    },
    {
      function: '时钟同步',
      topicClass: `/ext/ntp/${props.product.productKey}/\${deviceName}/request`,
      operationPermission: '发布',
      description: 'NTP 时钟同步请求'
    },
    {
      function: '时钟同步',
      topicClass: `/ext/ntp/${props.product.productKey}/\${deviceName}/response`,
      operationPermission: '订阅',
      description: 'NTP 时钟同步响应'
    },
    {
      function: '设备影子',
      topicClass: `/shadow/update/${props.product.productKey}/\${deviceName}`,
      operationPermission: '发布',
      description: '设备影子发布'
    },
    {
      function: '设备影子',
      topicClass: `/shadow/get/${props.product.productKey}/\${deviceName}`,
      operationPermission: '订阅',
      description: '设备接收影子变更'
    },
    {
      function: '配置更新',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/config/push`,
      operationPermission: '订阅',
      description: '云端主动下推配置信息'
    },
    {
      function: '配置更新',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/config/get`,
      operationPermission: '发布',
      description: '设备端查询配置信息'
    },
    {
      function: '配置更新',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/config/get_reply`,
      operationPermission: '订阅',
      description: '云端响应配置信息'
    },
    {
      function: '广播',
      topicClass: `/broadcast/${props.product.productKey}/\${identifier}`,
      operationPermission: '订阅',
      description: '广播 Topic，identifier 为用户自定义字符串'
    }
  ]
})

// 物模型通信 Topic 列
const functionColumn = reactive([
  { label: '功能', field: 'function', width: 150 },
  { label: 'Topic 类', field: 'topicClass', width: 800 },
  { label: '操作权限', field: 'operationPermission', width: 100 },
  { label: '描述', field: 'description' }
])

// 物模型通信 Topic 数据
const functionData = computed(() => {
  if (!props.product || !props.product.productKey) return []
  return [
    {
      function: '属性上报',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/event/property/post`,
      operationPermission: '发布',
      description: '设备属性上报'
    },
    {
      function: '属性上报',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/event/property/post_reply`,
      operationPermission: '订阅',
      description: '云端响应属性上报'
    },
    {
      function: '属性设置',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/service/property/set`,
      operationPermission: '订阅',
      description: '设备属性设置'
    },
    {
      function: '事件上报',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/event/\${tsl.event.identifier}/post`,
      operationPermission: '发布',
      description: '设备事件上报'
    },
    {
      function: '事件上报',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/event/\${tsl.event.identifier}/post_reply`,
      operationPermission: '订阅',
      description: '云端响应事件上报'
    },
    {
      function: '服务调用',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/service/\${tsl.service.identifier}`,
      operationPermission: '订阅',
      description: '设备服务调用'
    },
    {
      function: '服务调用',
      topicClass: `/sys/${props.product.productKey}/\${deviceName}/thing/service/\${tsl.service.identifier}_reply`,
      operationPermission: '发布',
      description: '设备端响应服务调用'
    }
  ]
})

// 通用的单元格合并方法生成器
const createSpanMethod = (data: any[]) => {
  // 预处理，计算每个功能的合并行数
  const rowspanMap: Record<number, number> = {}
  let currentFunction = ''
  let startIndex = 0
  let count = 0

  data.forEach((item, index) => {
    if (item.function !== currentFunction) {
      if (count > 0) {
        rowspanMap[startIndex] = count
      }
      currentFunction = item.function
      startIndex = index
      count = 1
    } else {
      count++
    }
  })

  // 处理最后一组
  if (count > 0) {
    rowspanMap[startIndex] = count
  }

  // 返回 span 方法
  return ({ row, column, rowIndex, columnIndex }: SpanMethodProps) => {
    if (columnIndex === 0) {
      // 仅对“功能”列进行合并
      const rowspan = rowspanMap[rowIndex] || 0
      if (rowspan > 0) {
        return {
          rowspan,
          colspan: 1
        }
      } else {
        return {
          rowspan: 0,
          colspan: 0
        }
      }
    }
  }
}
</script>
