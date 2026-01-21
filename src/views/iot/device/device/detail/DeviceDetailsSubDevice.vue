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
  <!-- TODO @AI：需要增加检索：产品、设备等检索，可以一起讨论下； -->
  <Dialog title="添加子设备" v-model="bindDialogVisible" width="800px">
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
    <template #footer>
      <el-button @click="bindDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleBindSubmit" :loading="bindFormLoading">
        确定（已选 {{ bindSelectedIds.length }} 个）
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'

const props = defineProps<{
  gatewayId: number
}>()

const message = useMessage()
const { push } = useRouter()

// TODO @AI：注释使用尾注释；
// 列表数据
const loading = ref(false)
const subDeviceList = ref<DeviceVO[]>([])
const selectedIds = ref<number[]>([])

// 绑定弹窗数据
const bindDialogVisible = ref(false)
const bindFormLoading = ref(false)
const bindTableRef = ref()
const bindableDevices = ref<DeviceVO[]>([])
const bindSelectedIds = ref<number[]>([])

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
  bindFormLoading.value = true
  try {
    // 获取可绑定的子设备列表
    const list = await DeviceApi.getBindableSubDeviceList(props.gatewayId)
    // 排除已绑定到当前网关的设备
    // TODO @AI：不用排除，后端已经排除；
    bindableDevices.value = list.filter((device: DeviceVO) => device.gatewayId !== props.gatewayId)
  } finally {
    bindFormLoading.value = false
  }
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
      ids: bindSelectedIds.value,
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
    await DeviceApi.unbindDeviceGateway({ ids: [id] })
    message.success('解绑成功')
    await getSubDeviceList()
  } catch {}
}

/** 批量解绑 */
const handleUnbindBatch = async () => {
  try {
    await message.confirm(`确定要解绑选中的 ${selectedIds.value.length} 个子设备吗？`)
    await DeviceApi.unbindDeviceGateway({ ids: selectedIds.value })
    message.success('批量解绑成功')
    selectedIds.value = []
    await getSubDeviceList()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getSubDeviceList()
})

// 暴露刷新方法
// TODO @AI：refresh 需要提供么？
defineExpose({ refresh: getSubDeviceList })
</script>
