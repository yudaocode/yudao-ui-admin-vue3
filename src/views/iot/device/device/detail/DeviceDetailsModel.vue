<!-- 设备物模型：运行状态（属性）、事件管理、服务调用 -->
<template>
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="运行状态" name="status">
        <ContentWrap>
          <!-- 搜索工作栏 -->
          <el-form
            class="-mb-15px"
            :model="queryParams"
            ref="queryFormRef"
            :inline="true"
            label-width="68px"
          >
            <el-form-item label="标识符" prop="identifier">
              <el-input
                v-model="queryParams.identifier"
                placeholder="请输入标识符"
                clearable
                class="!w-240px"
              />
            </el-form-item>
            <el-form-item label="属性名称" prop="name">
              <el-input
                v-model="queryParams.name"
                placeholder="请输入属性名称"
                clearable
                class="!w-240px"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleQuery"
                ><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button
              >
              <el-button @click="resetQuery"
                ><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button
              >
            </el-form-item>
          </el-form>
        </ContentWrap>
        <ContentWrap>
          <el-tabs>
            <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
              <el-table-column label="属性标识符" align="center" prop="property.identifier" />
              <el-table-column label="属性名称" align="center" prop="property.name" />
              <el-table-column label="数据类型" align="center" prop="property.dataType" />
              <el-table-column label="属性值" align="center" prop="value" />
              <el-table-column
                label="更新时间"
                align="center"
                prop="updateTime"
                :formatter="dateFormatter"
                width="180px"
              />
              <el-table-column label="操作" align="center">
                <template #default="scope">
                  <el-button
                    link
                    type="primary"
                    @click="openDetail(props.device.id, scope.row.property.identifier)"
                  >
                    查看数据
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tabs>
          <!-- 表单弹窗：添加/修改 -->
          <DeviceDataDetail ref="detailRef" :device="device" :product="product" />
        </ContentWrap>
      </el-tab-pane>
      <el-tab-pane label="事件管理" name="event">
        <p>事件管理</p>
      </el-tab-pane>
      <el-tab-pane label="服务调用" name="service">
        <p>服务调用</p>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceDataVO, DeviceVO } from '@/api/iot/device/device'
import { dateFormatter } from '@/utils/formatTime'
import DeviceDataDetail from './DeviceDataDetail.vue'

const props = defineProps<{ product: ProductVO; device: DeviceVO }>()

const loading = ref(true) // 列表的加载中
const list = ref<DeviceDataVO[]>([]) // 列表的数据
const queryParams = reactive({
  deviceId: -1,
  identifier: undefined as string | undefined,
  name: undefined as string | undefined
})

const queryFormRef = ref() // 搜索的表单
const activeTab = ref('status') // 默认选中的标签

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.deviceId = props.device.id
    list.value = await DeviceApi.getLatestDeviceProperties(queryParams)
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryParams.identifier = undefined
  queryParams.name = undefined
  handleQuery()
}

/** 添加/修改操作 */
const detailRef = ref()
const openDetail = (deviceId: number, identifier: string) => {
  detailRef.value.open(deviceId, identifier)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
