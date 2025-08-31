<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="告警配置" prop="configId">
        <el-select
          v-model="queryParams.configId"
          placeholder="请选择告警配置"
          clearable
          filterable
          class="!w-240px"
        >
          <el-option
            v-for="config in alertConfigList"
            :key="config.id"
            :label="config.name"
            :value="config.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="告警级别" prop="configLevel">
        <el-select
          v-model="queryParams.configLevel"
          placeholder="请选择告警级别"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.IOT_ALERT_LEVEL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品" prop="productId">
        <el-select
          v-model="queryParams.productId"
          placeholder="请选择产品"
          clearable
          filterable
          @change="handleProductChange"
          class="!w-240px"
        >
          <el-option
            v-for="product in productList"
            :key="product.id"
            :label="product.name"
            :value="product.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="设备" prop="deviceId">
        <el-select
          v-model="queryParams.deviceId"
          placeholder="请选择设备"
          clearable
          filterable
          class="!w-240px"
        >
          <el-option
            v-for="device in filteredDeviceList"
            :key="device.id"
            :label="device.deviceName"
            :value="device.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否处理" prop="processStatus">
        <el-select
          v-model="queryParams.processStatus"
          placeholder="请选择是否处理"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="记录编号" align="center" prop="id" />
      <el-table-column label="告警名称" align="center" prop="configName" />
      <el-table-column label="告警级别" align="center" prop="configLevel">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.IOT_ALERT_LEVEL" :value="scope.row.configLevel" />
        </template>
      </el-table-column>
      <el-table-column label="产品名称" align="center" prop="productId">
        <template #default="scope">
          {{ getProductName(scope.row.productId) }}
        </template>
      </el-table-column>
      <el-table-column label="设备名称" align="center" prop="deviceId">
        <template #default="scope">
          {{ getDeviceName(scope.row.deviceId) }}
        </template>
      </el-table-column>
      <el-table-column label="触发的设备消息" align="center" prop="deviceMessage">
        <template #default="scope">
          <el-popover
            placement="top-start"
            :width="600"
            trigger="hover"
            v-if="scope.row.deviceMessage"
          >
            <template #reference>
              <el-button link type="primary">
                <Icon icon="ep:view" class="mr-5px" />
                查看消息
              </el-button>
            </template>
            <pre>{{ scope.row.deviceMessage }}</pre>
          </el-popover>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="是否处理" align="center" prop="processStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.processStatus" />
        </template>
      </el-table-column>
      <el-table-column label="处理结果" align="center" prop="processRemark" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            v-if="!scope.row.processStatus"
            link
            type="primary"
            @click="handleProcess(scope.row)"
            v-hasPermi="['iot:alert-record:process']"
          >
            处理
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { AlertRecordApi, AlertRecord } from '@/api/iot/alert/record'
import { AlertConfigApi, AlertConfig } from '@/api/iot/alert/config'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { DICT_TYPE, getIntDictOptions, getBoolDictOptions } from '@/utils/dict'

/** IoT 告警记录列表 */
defineOptions({ name: 'IotAlertRecord' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<AlertRecord[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const alertConfigList = ref<AlertConfig[]>([]) // 告警配置列表
const productList = ref<ProductVO[]>([]) // 产品列表
const deviceList = ref<DeviceVO[]>([]) // 设备列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  configId: undefined as number | undefined,
  configLevel: undefined as number | undefined,
  productId: undefined as number | undefined,
  deviceId: undefined as number | undefined,
  processStatus: undefined as boolean | undefined,
  createTime: [] as string[]
})
const queryFormRef = ref() // 搜索的表单

/** 根据选择的产品 ID，筛选设备列表 */
const filteredDeviceList = computed(() => {
  if (!queryParams.productId) {
    return deviceList.value
  }
  return deviceList.value.filter((device) => device.productId === queryParams.productId)
})

/** 根据产品 ID 获取产品名称 */
const getProductName = (productId: number) => {
  if (!productId) {
    return `-`
  }
  const product = productList.value.find((p) => p.id === productId)
  return product ? product.name : `加载中...`
}

/** 根据设备 ID 获取设备名称 */
const getDeviceName = (deviceId: number) => {
  if (!deviceId) {
    return `-`
  }
  const device = deviceList.value.find((d) => d.id === deviceId)
  return device ? device.deviceName : `加载中...`
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await AlertRecordApi.getAlertRecordPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
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

/** 产品变更处理 */
const handleProductChange = () => {
  queryParams.deviceId = undefined // 清空设备选择
}

/** 处理告警记录 */
const handleProcess = async (row: AlertRecord) => {
  try {
    const { value: processRemark } = await ElMessageBox.prompt('请输入处理原因', '处理告警记录', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await AlertRecordApi.processAlertRecord(row.id, processRemark)
    message.success('处理成功')
    await getList()
  } catch (error) {}
}

/** 初始化 **/
onMounted(async () => {
  await getList()
  alertConfigList.value = await AlertConfigApi.getSimpleAlertConfigList()
  productList.value = await ProductApi.getSimpleProductList()
  deviceList.value = await DeviceApi.getSimpleDeviceList()
})
</script>
