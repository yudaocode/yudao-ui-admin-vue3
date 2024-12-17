<template>
  <Dialog title="查看数据" v-model="dialogVisible">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.times"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="datetimerange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="!w-350px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>
    <ContentWrap>
      <el-table v-loading="detailLoading" :data="list" :stripe="true" :show-overflow-tooltip="true">
        <el-table-column
          label="时间"
          align="center"
          prop="time"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="原始值" align="center" prop="data" />
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
  </Dialog>
</template>
<script setup lang="ts">
import { DeviceApi, DeviceHistoryDataVO, DeviceVO } from '@/api/iot/device/device'
import { ProductVO } from '@/api/iot/product/product'
import { beginOfDay, dateFormatter, endOfDay, formatDate } from '@/utils/formatTime'

const props = defineProps<{ product: ProductVO; device: DeviceVO }>()

/** IoT 设备 数据详情 */
defineOptions({ name: 'IoTDeviceDataDetail' })

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false)

const list = ref<DeviceHistoryDataVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  deviceId: -1,
  identifier: undefined as string | undefined,
  times: [
    // 默认显示最近一周的数据
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
    formatDate(endOfDay(new Date()))
  ]
})

const queryFormRef = ref() // 搜索的表单

const getList = async () => {
  detailLoading.value = true
  try {
    const data = await DeviceApi.getDevicePropertiesHistoryData(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    detailLoading.value = false
  }
}

/** 打开弹窗 */
const open = async (deviceId: number, identifier: String) => {
  dialogVisible.value = true
  queryParams.deviceId = deviceId
  queryParams.identifier = identifier
  getList()
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
