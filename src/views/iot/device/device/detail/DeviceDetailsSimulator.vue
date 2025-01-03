<template>
  <ContentWrap>
    <el-row :gutter="20">
      <!-- 左侧指令调试区域 -->
      <el-col :span="12">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 上行指令调试 -->
          <el-tab-pane label="上行指令调试" name="up">
            <el-tabs v-model="subTab" v-if="activeTab === 'up'">
              <!-- 属性上报 -->
              <el-tab-pane label="属性上报" name="property">
                <ContentWrap>
                  <el-table v-loading="loading" :data="propertyList" :stripe="true">
                    <el-table-column label="值" align="center" width="80">
                      <template #default="scope">
                        <el-input v-model="scope.row.value" class="!w-60px" />
                      </template>
                    </el-table-column>
                    <el-table-column label="功能名称" align="center" prop="name" />
                    <el-table-column label="标识符" align="center" prop="identifier" />
                    <el-table-column label="数据类型" align="center" prop="dataType" />
                    <el-table-column label="数据定义" align="center" prop="specs" :show-overflow-tooltip="true" />
                  </el-table>
                  <div class="mt-10px">
                    <el-button type="primary" @click="handlePropertyReport">发送</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>

              <!-- 事件上报 -->
              <el-tab-pane label="事件上报" name="event">
                <ContentWrap>
                  <el-table v-loading="loading" :data="eventList" :stripe="true">
                    <el-table-column label="值" align="center" width="80">
                      <template #default="scope">
                        <el-input v-model="scope.row.value" class="!w-60px" />
                      </template>
                    </el-table-column>
                    <el-table-column label="功能名称" align="center" prop="name" />
                    <el-table-column label="标识符" align="center" prop="identifier" />
                    <el-table-column label="数据类型" align="center" prop="dataType" />
                    <el-table-column label="数据定义" align="center" prop="specs" :show-overflow-tooltip="true" />
                  </el-table>
                  <div class="mt-10px">
                    <el-button type="primary" @click="handleEventReport">发送</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>

              <!-- 状态变更 -->
              <el-tab-pane label="状态变更" name="status">
                <ContentWrap>
                  <div class="flex gap-4">
                    <el-button type="primary" @click="handleDeviceState('online')">设备上线</el-button>
                    <el-button type="primary" @click="handleDeviceState('offline')">设备下线</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <!-- 下行指令调试 -->
          <el-tab-pane label="下行指令调试" name="down">
            <el-tabs v-model="subTab" v-if="activeTab === 'down'">
              <!-- 属性调试 -->
              <el-tab-pane label="属性调试" name="propertyDebug">
                <ContentWrap>
                  <el-table v-loading="loading" :data="propertyList" :stripe="true">
                    <el-table-column label="值" align="center" width="80">
                      <template #default="scope">
                        <el-input v-model="scope.row.value" class="!w-60px" />
                      </template>
                    </el-table-column>
                    <el-table-column label="功能名称" align="center" prop="name" />
                    <el-table-column label="标识符" align="center" prop="identifier" />
                    <el-table-column label="数据类型" align="center" prop="dataType" />
                    <el-table-column label="数据定义" align="center" prop="specs" :show-overflow-tooltip="true" />
                  </el-table>
                  <div class="mt-10px">
                    <el-button type="primary" @click="handlePropertyGet">获取</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>

              <!-- 服务调用 -->
              <el-tab-pane label="服务调用" name="service">
                <ContentWrap>
                  <!-- 服务调用相关内容 -->
                </ContentWrap>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>
        </el-tabs>
      </el-col>

      <!-- 右侧设备日志区域 -->
      <el-col :span="12">
        <el-tabs type="border-card">
          <el-tab-pane label="设备日志">
            <DeviceDetailsLog :device-id="device.id" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import DeviceDetailsLog from './DeviceDetailsLog.vue'

const message = useMessage() // 消息弹窗
const loading = ref(false)
const activeTab = ref('up')
const subTab = ref('property')

const props = defineProps<{ product: ProductVO; device: DeviceVO }>()

// 功能列表数据结构定义
interface TableItem {
  name: string
  identifier: string
  dataType: string
  specs: string
  value: string | number
}

// 属性列表数据
const propertyList = ref<TableItem[]>([
  {
    name: '电量',
    identifier: 'power',
    dataType: 'int32',
    specs: '',
    value: ''
  },
  {
    name: '设备型号',
    identifier: 'DeviceType',
    dataType: 'text',
    specs: '{ "length": "128" }',
    value: ''
  },
  {
    name: '信号强度',
    identifier: 'rssi',
    dataType: 'int32',
    specs: '{ "min": "-127", "max": "127" }',
    value: ''
  },
  {
    name: '门状态',
    identifier: 'doorStatus',
    dataType: 'enum',
    specs: '{ "0": "关", "1": "开" }',
    value: ''
  }
])

// 事件列表数据
const eventList = ref<TableItem[]>([])

// 处理属性上报
const handlePropertyReport = async () => {
  // TODO: 实现属性上报逻辑
  message.success('属性上报成功')
}

// 处理事件上报
const handleEventReport = async () => {
  // TODO: 实现事件上报逻辑
  message.success('事件上报成功')
}

// 处理设备状态变更
const handleDeviceState = async (state: 'online' | 'offline') => {
  // TODO: 实现设备状态变更逻辑
  message.success(`设备${state === 'online' ? '上线' : '下线'}成功`)
}

// 处理属性获取
const handlePropertyGet = async () => {
  // TODO: 实现属性获取逻辑
  message.success('属性获取成功')
}

// 初始化
onMounted(() => {
  // TODO: 获取初始数据
})
</script>
