<!-- 模拟设备 -->
<template>
  <ContentWrap>
    <el-row :gutter="20">
      <!-- 左侧指令调试区域 -->
      <el-col :span="12">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 上行指令调试 -->
          <el-tab-pane label="上行指令调试" name="up">
            <el-tabs v-if="activeTab === 'up'" v-model="subTab">
              <!-- 属性上报 -->
              <el-tab-pane label="属性上报" name="property">
                <ContentWrap>
                  <el-table
                    v-loading="loading"
                    :data="list"
                    :show-overflow-tooltip="true"
                    :stripe="true"
                  >
                    <!-- TODO @super：每个 colum 搞下宽度，避免 table 每一列最后有个 . -->
                    <!-- TODO @super：可以左侧 fixed -->
                    <el-table-column align="center" label="功能名称" prop="name" />
                    <el-table-column align="center" label="标识符" prop="identifier" />
                    <el-table-column align="center" label="数据类型" prop="identifier">
                      <!-- TODO @super：不用翻译，可以减少宽度的占用 -->
                      <template #default="{ row }">
                        {{ dataTypeOptionsLabel(row.property?.dataType) ?? '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column align="left" label="数据定义" prop="identifier">
                      <template #default="{ row }">
                        <DataDefinition :data="row" />
                      </template>
                    </el-table-column>
                    <!-- TODO @super：可以右侧 fixed -->
                    <el-table-column align="center" label="值" width="80">
                      <template #default="scope">
                        <el-input v-model="scope.row.simulateValue" class="!w-60px" />
                      </template>
                    </el-table-column>
                  </el-table>
                  <!-- TODO @super：发送按钮，可以放在右侧哈。因为我们的 simulateValue 就在最右侧 -->
                  <div class="mt-10px">
                    <el-button type="primary" @click="handlePropertyReport"> 发送</el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>

              <!-- 事件上报 -->
              <!-- TODO @super：待实现 -->
              <el-tab-pane label="事件上报" name="event">
                <ContentWrap>
                  <!-- TODO @super：因为事件是每个 event 去模拟，而不是类似属性的批量上传。所以，可以每一列后面有个“模拟”按钮。另外，“值”使用 textarea，高度 3 -->
                  <!-- <el-table v-loading="loading" :data="eventList" :stripe="true">
                    <el-table-column label="功能名称" align="center" prop="name" />
                    <el-table-column label="标识符" align="center" prop="identifier" />
                    <el-table-column label="数据类型" align="center" prop="dataType" />
                    <el-table-column
                      label="数据定义"
                      align="center"
                      prop="specs"
                      :show-overflow-tooltip="true"
                    />
                    <el-table-column label="值" align="center" width="80">
                      <template #default="scope">
                        <el-input v-model="scope.row.simulateValue" class="!w-60px" />
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="mt-10px">
                    <el-button type="primary" @click="handleEventReport">发送</el-button>
                  </div> -->
                </ContentWrap>
              </el-tab-pane>

              <!-- 状态变更 -->
              <el-tab-pane label="状态变更" name="status">
                <ContentWrap>
                  <div class="flex gap-4">
                    <el-button type="primary" @click="handleDeviceState(DeviceStateEnum.ONLINE)">
                      设备上线
                    </el-button>
                    <el-button type="danger" @click="handleDeviceState(DeviceStateEnum.OFFLINE)">
                      设备下线
                    </el-button>
                  </div>
                </ContentWrap>
              </el-tab-pane>
            </el-tabs>
          </el-tab-pane>

          <!-- 下行指令调试 -->
          <!-- TODO @super：待实现 -->
          <el-tab-pane label="下行指令调试" name="down">
            <el-tabs v-if="activeTab === 'down'" v-model="subTab">
              <!-- 属性调试 -->
              <el-tab-pane label="属性调试" name="propertyDebug">
                <ContentWrap>
                  <!-- <el-table v-loading="loading" :data="propertyList" :stripe="true">
                    <el-table-column label="功能名称" align="center" prop="name" />
                    <el-table-column label="标识符" align="center" prop="identifier" />
                    <el-table-column label="数据类型" align="center" prop="dataType" />
                    <el-table-column
                      label="数据定义"
                      align="center"
                      prop="specs"
                      :show-overflow-tooltip="true"
                    />
                    <el-table-column label="值" align="center" width="80">
                      <template #default="scope">
                        <el-input v-model="scope.row.simulateValue" class="!w-60px" />
                      </template>
                    </el-table-column>
                  </el-table>
                  <div class="mt-10px">
                    <el-button type="primary" @click="handlePropertyGet">获取</el-button>
                  </div> -->
                </ContentWrap>
              </el-tab-pane>

              <!-- 服务调用 -->
              <!-- TODO @super：待实现 -->
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
            <DeviceDetailsLog :device-key="device.deviceKey" />
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { ProductVO } from '@/api/iot/product/product'
import { SimulatorData, ThingModelApi } from '@/api/iot/thingmodel'
import { DeviceApi, DeviceStateEnum, DeviceVO } from '@/api/iot/device/device'
import DeviceDetailsLog from './DeviceDetailsLog.vue'
import { getDataTypeOptionsLabel } from '@/views/iot/thingmodel/config'
import { DataDefinition } from '@/views/iot/thingmodel/components'

const props = defineProps<{
  product: ProductVO
  device: DeviceVO
}>()

const message = useMessage() // 消息弹窗
const activeTab = ref('up') // TODO @super：upstream 上行、downstream 下行
const subTab = ref('property') // TODO @super：upstreamTab

const loading = ref(false)
const queryParams = reactive({
  type: undefined, // TODO @super：type 默认给个第一个 tab 对应的，避免下面 watch 爆红
  productId: -1
})
const list = ref<SimulatorData[]>([]) // 物模型列表的数据 TODO @super：thingModelList
// TODO @super：dataTypeOptionsLabel 是不是不用定义，直接用 getDataTypeOptionsLabel 在 template 中使用即可？
const dataTypeOptionsLabel = computed(() => (value: string) => getDataTypeOptionsLabel(value)) // 解析数据类型

/** 查询物模型列表 */
// TODO @super：getThingModelList 更精准
const getList = async () => {
  loading.value = true
  try {
    queryParams.productId = props.product?.id || -1
    const data = await ThingModelApi.getThingModelList(queryParams)
    // 转换数据，添加 simulateValue 字段
    // TODO @super：貌似下面的 simulateValue 不设置也可以？
    list.value = data.map((item) => ({
      ...item,
      simulateValue: ''
    }))
  } finally {
    loading.value = false
  }
}

// // 功能列表数据结构定义
// interface TableItem {
//   name: string
//   identifier: string
//   value: string | number
// }

// // 添加计算属性来过滤物模型数据
// const propertyList = computed(() => {
//   return list.value
//     .filter((item) => item.type === 'property')
//     .map((item) => ({
//       name: item.name,
//       identifier: item.identifier,
//       value: ''
//     }))
// })

// const eventList = computed(() => {
//   return list.value
//     .filter((item) => item.type === 'event')
//     .map((item) => ({
//       name: item.name,
//       identifier: item.identifier,
//       value: ''
//     }))
// })

/** 监听标签页变化 */
// todo:后续改成查询字典
watch(
  [activeTab, subTab],
  ([newActiveTab, newSubTab]) => {
    // 根据标签页设置查询类型
    if (newActiveTab === 'up') {
      switch (newSubTab) {
        case 'property':
          queryParams.type = 1
          break
        case 'event':
          queryParams.type = 3
          break
        // case 'status':
        //   queryParams.type = 'status'
        //   break
      }
    } else if (newActiveTab === 'down') {
      switch (newSubTab) {
        case 'propertyDebug':
          queryParams.type = 1
          break
        case 'service':
          queryParams.type = 2
          break
      }
    }
    getList() // 切换标签时重新获取数据
  },
  { immediate: true }
)

/** 处理属性上报 */
const handlePropertyReport = async () => {
  // TODO @super:数据类型效验
  const data: Record<string, object> = {}
  list.value.forEach((item) => {
    // 只有当 simulateValue 有值时才添加到 content 中
    // TODO @super：直接 if (item.simulateValue) 就可以哈，js 这块还是比较灵活的
    if (item.simulateValue !== undefined && item.simulateValue !== '') {
      // TODO @super：这里有个红色的 idea 告警，觉得去除下
      data[item.identifier] = item.simulateValue
    }
  })

  try {
    await DeviceApi.upstreamDevice({
      id: props.device.id,
      type: 'property',
      identifier: 'report',
      data: data
    })
    message.success('属性上报成功')
  } catch (error) {
    message.error('属性上报失败')
  }
}

// // 处理事件上报
// const handleEventReport = async () => {
//   const contentObj: Record<string, any> = {}
//   list.value
//     .filter(item => item.type === 'event')
//     .forEach((item) => {
//       if (item.simulateValue !== undefined && item.simulateValue !== '') {
//         contentObj[item.identifier] = item.simulateValue
//       }
//     })

//   const reportData: ReportData = {
//     productKey: props.product.productKey,
//     deviceKey: props.device.deviceKey,
//     type: 'event',
//     subType: list.value.find(item => item.type === 'event')?.identifier || '',
//     reportTime: new Date().toISOString(),
//     content: JSON.stringify(contentObj)  // 转换为 JSON 字符串
//   }

//   try {
//     // TODO: 调用API发送数据
//     console.log('上报数据:', reportData)
//     message.success('事件上报成功')
//   } catch (error) {
//     message.error('事件上报失败')
//   }
// }

/** 处理设备状态 */
const handleDeviceState = async (state: number) => {
  try {
    await DeviceApi.upstreamDevice({
      id: props.device.id,
      type: 'state',
      identifier: 'report',
      data: state
    })
    message.success(`设备${state === DeviceStateEnum.ONLINE ? '上线' : '下线'}成功`)
  } catch (error) {
    message.error(`设备${state === DeviceStateEnum.ONLINE ? '上线' : '下线'}失败`)
  }
}

// 处理属性获取
const handlePropertyGet = async () => {
  // TODO: 实现属性获取逻辑
  message.success('属性获取成功')
}

// 初始化
onMounted(() => {
  getList()
})
// TODO @芋艿：后续再详细 review 下；
</script>
