<!-- 子设备管理 -->
<template>
  <ContentWrap>
    <!-- 操作按钮 -->
    <div class="mb-4">
      <el-button type="primary" plain @click="openBindDialog" v-hasPermi="['iot:device:update']">
        <Icon icon="ep:plus" class="mr-5px" /> 添加子设备
      </el-button>
      <el-button
        type="danger"
        plain
        @click="handleUnbindBatch"
        :disabled="selectedIds.length === 0"
        v-hasPermi="['iot:device:update']"
      >
        <Icon icon="ep:delete" class="mr-5px" /> 批量解绑
      </el-button>
    </div>

    <!-- 子设备列表 -->
    <el-table
      v-loading="loading"
      :data="subDeviceList"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="DeviceName" align="center" prop="deviceName">
        <template #default="{ row }">
          <el-link type="primary" @click="openDeviceDetail(row.id)">{{ row.deviceName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column label="备注名称" align="center" prop="nickname" />
      <el-table-column label="产品名称" align="center" prop="productName" />
      <el-table-column label="设备状态" align="center" prop="state">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="row.state" />
        </template>
      </el-table-column>
      <el-table-column
        label="最后上线时间"
        align="center"
        prop="onlineTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="120px">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDeviceDetail(row.id)"> 查看 </el-button>
          <el-button
            link
            type="danger"
            @click="handleUnbind(row.id)"
            v-hasPermi="['iot:device:update']"
          >
            解绑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 添加子设备弹窗 -->
  <Dialog title="添加子设备" v-model="bindDialogVisible" width="900px">
    <ContentWrap>
      <!-- 搜索区域 -->
      <el-form :model="bindQueryParams" ref="bindQueryFormRef" :inline="true" class="-mb-15px">
        <el-form-item label="产品" prop="productId">
          <ProductSelect
            v-model="bindQueryParams.productId"
            :device-type="DeviceTypeEnum.GATEWAY_SUB"
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input
            v-model="bindQueryParams.deviceName"
            placeholder="请输入设备名称"
            clearable
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getBindableDevicePage">
            <Icon icon="ep:search" class="mr-5px" /> 搜索
          </el-button>
          <el-button @click="resetBindQuery">
            <Icon icon="ep:refresh" class="mr-5px" /> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap>
      <!-- 分页表格 -->
      <el-table
        ref="bindTableRef"
        v-loading="bindFormLoading"
        :data="bindableDevices"
        :stripe="true"
        :show-overflow-tooltip="true"
        @selection-change="handleBindSelectionChange"
        max-height="400px"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="DeviceName" align="center" prop="deviceName" />
        <el-table-column label="备注名称" align="center" prop="nickname" />
        <el-table-column label="产品名称" align="center" prop="productName" />
        <el-table-column label="设备状态" align="center" prop="state">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="row.state" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <Pagination
        v-model:page="bindQueryParams.pageNo"
        v-model:limit="bindQueryParams.pageSize"
        :total="bindTotal"
        @pagination="getBindableDevicePage"
      />
    </ContentWrap>

    <template #footer>
      <el-button type="primary" @click="handleBindSubmit" :loading="bindFormLoading">
        确定（已选 {{ bindSelectedIds.length }} 个）
      </el-button>
      <el-button @click="bindDialogVisible = false">取消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { DeviceTypeEnum } from '@/api/iot/product/product'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import ProductSelect from '@/views/iot/product/product/components/ProductSelect.vue'

const props = defineProps<{
  gatewayId: number
}>()

const message = useMessage()
const { push } = useRouter()

const loading = ref(false) // 列表加载状态
const subDeviceList = ref<DeviceVO[]>([]) // 子设备列表
const selectedIds = ref<number[]>([]) // 选中的设备ID

const bindDialogVisible = ref(false) // 绑定弹窗可见性
const bindFormLoading = ref(false) // 绑定弹窗加载状态
const bindTableRef = ref()
const bindQueryFormRef = ref()
const bindableDevices = ref<DeviceVO[]>([]) // 可绑定设备列表
const bindSelectedIds = ref<number[]>([]) // 绑定选中的设备ID
const bindTotal = ref(0) // 可绑定设备总数
const bindQueryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  productId: undefined as number | undefined,
  deviceName: ''
})

/** 获取子设备列表 */
const getSubDeviceList = async () => {
  loading.value = true
  try {
    subDeviceList.value = await DeviceApi.getSubDeviceList(props.gatewayId)
  } finally {
    loading.value = false
  }
}

/** 打开设备详情 */
const openDeviceDetail = (id: number) => {
  push({ name: 'IoTDeviceDetail', params: { id } })
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: DeviceVO[]) => {
  selectedIds.value = selection.map((item) => item.id)
}

/** 打开绑定弹窗 */
const openBindDialog = async () => {
  bindSelectedIds.value = []
  bindDialogVisible.value = true
  await getBindableDevicePage()
}

/** 获取可绑定设备分页 */
const getBindableDevicePage = async () => {
  bindFormLoading.value = true
  try {
    const result = await DeviceApi.getUnboundSubDevicePage(bindQueryParams)
    bindableDevices.value = result.list
    bindTotal.value = result.total
  } finally {
    bindFormLoading.value = false
  }
}

/** 重置绑定弹窗搜索条件 */
const resetBindQuery = () => {
  bindQueryParams.pageNo = 1
  bindQueryParams.productId = undefined
  bindQueryParams.deviceName = ''
  getBindableDevicePage()
}

/** 绑定弹窗多选框选中数据 */
const handleBindSelectionChange = (selection: DeviceVO[]) => {
  bindSelectedIds.value = selection.map((item) => item.id)
}

/** 提交绑定 */
const handleBindSubmit = async () => {
  if (bindSelectedIds.value.length === 0) {
    message.warning('请选择要绑定的子设备')
    return
  }
  bindFormLoading.value = true
  try {
    await DeviceApi.bindDeviceGateway({
      subIds: bindSelectedIds.value,
      gatewayId: props.gatewayId
    })
    message.success('绑定成功')
    bindDialogVisible.value = false
    await getSubDeviceList()
  } finally {
    bindFormLoading.value = false
  }
}

/** 解绑单个设备 */
const handleUnbind = async (id: number) => {
  try {
    await message.confirm('确定要解绑该子设备吗？')
    await DeviceApi.unbindDeviceGateway({ subIds: [id], gatewayId: props.gatewayId })
    message.success('解绑成功')
    await getSubDeviceList()
  } catch {}
}

/** 批量解绑 */
const handleUnbindBatch = async () => {
  try {
    await message.confirm(`确定要解绑选中的 ${selectedIds.value.length} 个子设备吗？`)
    await DeviceApi.unbindDeviceGateway({ subIds: selectedIds.value, gatewayId: props.gatewayId })
    message.success('批量解绑成功')
    selectedIds.value = []
    await getSubDeviceList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getSubDeviceList()
})
</script>
