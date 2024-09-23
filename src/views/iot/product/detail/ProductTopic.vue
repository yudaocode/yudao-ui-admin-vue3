<template>
  <ContentWrap>
    <el-tabs>
      <el-tab-pane label="基础通信 Topic">
        <Table :columns="columns1" :data="data1" :span-method="objectSpanMethod" />
      </el-tab-pane>
      <el-tab-pane label="物模型通信 Topic">
        <Table :columns="columns2" :data="data2" :span-method="objectSpanMethod" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product'

const { product } = defineProps<{ product: ProductVO }>()
// 定义列
const columns1 = reactive([
  {
    label: '功能',
    field: 'function',
    width: 150
  },
  {
    label: 'Topic 类',
    field: 'topicClass',
    width: 500
  },
  {
    label: '操作权限',
    field: 'operationPermission',
    width: 100
  },
  {
    label: '描述',
    field: 'description'
  }
])

const columns2 = reactive([
  {
    label: '功能',
    field: 'function',
    width: 150
  },
  {
    label: 'Topic 类',
    field: 'topicClass',
    width: 500
  },
  {
    label: '操作权限',
    field: 'operationPermission',
    width: 150
  },
  {
    label: '描述',
    field: 'description'
  }
])

// 定义数据
const data1 = reactive([
  {
    function: 'OTA 升级',
    topicClass: '/ota/device/inform/' + product.productKey + '/${deviceName}',
    operationPermission: '发布',
    description: '设备上报固件升级信息'
  },
  {
    function: 'OTA 升级',
    topicClass: '/ota/device/upgrade/' + product.productKey + '/${deviceName}',
    operationPermission: '订阅',
    description: '固件升级信息下行'
  },
  {
    function: 'OTA 升级',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/ota/firmware/get',
    operationPermission: '发布',
    description: '设备上报固件升级进度'
  },
  {
    function: 'OTA 升级',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/ota/firmware/get',
    operationPermission: '发布',
    description: '设备主动拉取固件升级信息'
  },
  {
    function: '设备标签',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/deviceinfo/update',
    operationPermission: '发布',
    description: '设备上报标签数据'
  },
  {
    function: '设备标签',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/deviceinfo/update_reply',
    operationPermission: '订阅',
    description: '云端响应标签上报'
  },
  {
    function: '设备标签',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/deviceinfo/delete',
    operationPermission: '订阅',
    description: '设备删除标签信息'
  },
  {
    function: '设备标签',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/deviceinfo/delete_reply',
    operationPermission: '订阅',
    description: '云端响应标签删除'
  },
  {
    function: '时钟同步',
    topicClass: '/ext/ntp/' + product.productKey + '/${deviceName}/request',
    operationPermission: '发布',
    description: 'NTP 时钟同步请求'
  },
  {
    function: '时钟同步',
    topicClass: '/ext/ntp/' + product.productKey + '/${deviceName}/response',
    operationPermission: '订阅',
    description: 'NTP 时钟同步响应'
  },
  {
    function: '设备影子',
    topicClass: '/shadow/update/' + product.productKey + '/${deviceName}',
    operationPermission: '发布',
    description: '设备影子发布'
  },
  {
    function: '设备影子',
    topicClass: '/shadow/get/' + product.productKey + '/${deviceName}',
    operationPermission: '订阅',
    description: '设备接收影子变更'
  },
  {
    function: '配置更新',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/config/push',
    operationPermission: '订阅',
    description: '云端主动下推配置信息'
  },
  {
    function: '配置更新',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/config/get',
    operationPermission: '发布',
    description: '设备端查询配置信息'
  },
  {
    function: '配置更新',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/config/get_reply',
    operationPermission: '订阅',
    description: '云端响应配置信息'
  },
  {
    function: '广播',
    topicClass: '/broadcast/' + product.productKey + '/${identifier}',
    operationPermission: '订阅',
    description: '广播 Topic，identifier 为用户自定义字符串'
  }
])

const data2 = reactive([
  {
    function: '属性上报',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/event/property/post',
    operationPermission: '发布',
    description: '设备属性上报'
  },
  {
    function: '属性上报',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/event/property/post_reply',
    operationPermission: '订阅',
    description: '云端响应属性上报'
  },
  {
    function: '属性设置',
    topicClass: '/sys/' + product.productKey + '/${deviceName}/thing/service/property/set',
    operationPermission: '订阅',
    description: '设备属性设置'
  },
  {
    function: '事件上报',
    topicClass:
      '/sys/' + product.productKey + '/${deviceName}/thing/event/${tsl.event.identifier}/post',
    operationPermission: '发布',
    description: '设备事件上报'
  },
  {
    function: '事件上报',
    topicClass:
      '/sys/' +
      product.productKey +
      '/${deviceName}/thing/event/${tsl.event.identifier}/post_reply',
    operationPermission: '订阅',
    description: '云端响应事件上报'
  },
  {
    function: '服务调用',
    topicClass:
      '/sys/' + product.productKey + '/${deviceName}/thing/service/${tsl.service.identifier}',
    operationPermission: '订阅',
    description: '设备服务调用'
  },
  {
    function: '服务调用',
    topicClass:
      '/sys/' + product.productKey + '/${deviceName}/thing/service/${tsl.service.identifier}_reply',
    operationPermission: '发布',
    description: '设备端响应服务调用'
  }
])

// 合并单元格
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: SpanMethodProps) => {
  if (columnIndex === 0 || columnIndex === 2) {
    if (rowIndex % 2 === 0) {
      return {
        rowspan: 2,
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
</script>
