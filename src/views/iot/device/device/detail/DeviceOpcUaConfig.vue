<!-- OPC UA 配置 -->
<template>
  <div>
    <!-- 连接配置区域 -->
    <ContentWrap>
      <div class="flex items-center justify-between mb-4">
        <span class="text-lg font-medium">连接配置</span>
        <el-button type="primary" @click="handleEditConfig" v-hasPermi="['iot:device:update']">
          编辑
        </el-button>
      </div>

      <el-alert
        v-if="isUnsupportedConfig"
        title="当前配置不受支持：OPC UA Client 只支持用户名认证（非 None 安全策略 + SignAndEncrypt），网关会拒绝该设备，请编辑为用户名认证并填写凭据别名"
        type="warning"
        show-icon
        :closable="false"
        class="mb-4"
      />

      <!-- 详情展示 -->
      <el-descriptions :column="3" border direction="horizontal">
        <el-descriptions-item label="端点地址" :span="3">
          {{ opcUaConfig.endpointUrl || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="安全策略">
          {{ opcUaConfig.securityPolicy || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="安全模式">
          {{ opcUaConfig.securityMode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="认证方式">
          {{ formatOption(OpcUaAuthTypeOptions, opcUaConfig.authType) }}
        </el-descriptions-item>
        <el-descriptions-item label="凭据别名">
          {{ opcUaConfig.credentialAlias || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="请求超时">
          {{ opcUaConfig.timeout ? `${opcUaConfig.timeout} ms` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="重试间隔">
          {{ opcUaConfig.retryInterval ? `${opcUaConfig.retryInterval} ms` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="opcUaConfig.status" />
        </el-descriptions-item>
      </el-descriptions>
    </ContentWrap>

    <!-- 点位配置区域 -->
    <ContentWrap class="mt-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-lg font-medium">点位配置</span>
        <el-button type="primary" @click="handleAddPoint" v-hasPermi="['iot:device:update']">
          <Icon icon="ep:plus" class="mr-1" />
          新增点位
        </el-button>
      </div>

      <!-- 搜索栏 -->
      <el-form :model="queryParams" :inline="true" class="-mb-15px">
        <el-form-item label="NodeId" prop="nodeId">
          <el-input
            v-model="queryParams.nodeId"
            placeholder="请输入 NodeId"
            clearable
            class="!w-200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="采集方式" prop="collectMode">
          <el-select
            v-model="queryParams.collectMode"
            placeholder="请选择采集方式"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="item in OpcUaCollectModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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

      <!-- 点位列表 -->
      <el-table
        v-loading="pointLoading"
        :data="pointList"
        :stripe="true"
        :show-overflow-tooltip="true"
        class="mt-4"
      >
        <el-table-column label="属性名称" align="center" prop="name" min-width="120">
          <template #default="scope">
            <span v-if="scope.row.thingModelValid">{{ scope.row.name }}</span>
            <el-tooltip
              v-else
              content="物模型属性已删除或不再是属性，网关会跳过该点位"
              placement="top"
            >
              <span class="text-red-500">物模型已失效</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="标识符" align="center" prop="identifier" min-width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.thingModelValid" size="small" type="primary">
              {{ scope.row.identifier }}
            </el-tag>
            <el-tag v-else size="small" type="danger">-</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="NodeId" align="left" prop="nodeId" min-width="260">
          <template #default="scope">
            <!-- 告警图标放在前面：NodeId 过长省略时仍然可见 -->
            <el-tooltip
              v-if="isNamespaceIndexBased(scope.row.nodeId)"
              content="ns= 索引可能随服务端重启变化，建议改为 nsu= 写法"
              placement="top"
            >
              <Icon icon="ep:warning" class="mr-1 text-orange-500" />
            </el-tooltip>
            <span class="font-mono">{{ scope.row.nodeId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="采集方式" align="center" prop="collectMode" min-width="200">
          <template #default="scope">
            {{ formatOption(OpcUaCollectModeOptions, scope.row.collectMode) }}
          </template>
        </el-table-column>
        <el-table-column label="采集间隔" align="center" prop="collectInterval" min-width="100">
          <template #default="scope"> {{ scope.row.collectInterval }} ms </template>
        </el-table-column>
        <el-table-column label="是否可写" align="center" prop="writable" min-width="90">
          <template #default="scope">
            <el-tag :type="scope.row.writable ? 'success' : 'info'">
              {{ scope.row.writable ? '可写' : '只读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" min-width="90">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" width="120">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="handleEditPoint(scope.row)"
              v-hasPermi="['iot:device:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDeletePoint(scope.row)"
              v-hasPermi="['iot:device:update']"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getPointPage"
      />
    </ContentWrap>

    <!-- 连接配置弹窗 -->
    <DeviceOpcUaConfigForm ref="configFormRef" :device-id="device.id" @success="getOpcUaConfig" />

    <!-- 点位表单弹窗 -->
    <DeviceOpcUaPointForm
      ref="pointFormRef"
      :device-id="device.id"
      :thing-model-list="thingModelList"
      @success="getPointPage"
    />
  </div>
</template>

<script lang="ts" setup>
import { DeviceVO } from '@/api/iot/device/device'
import { ThingModelData } from '@/api/iot/thingmodel'
import { DeviceOpcUaConfigApi, DeviceOpcUaConfigVO } from '@/api/iot/device/opcua/config'
import { DeviceOpcUaPointApi, DeviceOpcUaPointVO } from '@/api/iot/device/opcua/point'
import {
  OpcUaAuthTypeEnum,
  OpcUaAuthTypeOptions,
  OpcUaCollectModeOptions,
  OpcUaSecurityModeEnum
} from '@/views/iot/utils/constants'
import { DICT_TYPE } from '@/utils/dict'
import DeviceOpcUaConfigForm from './DeviceOpcUaConfigForm.vue'
import DeviceOpcUaPointForm from './DeviceOpcUaPointForm.vue'

defineOptions({ name: 'DeviceOpcUaConfig' })

const props = defineProps<{
  device: DeviceVO
  thingModelList: ThingModelData[]
}>()

const message = useMessage()

/** 格式化选项 */
const formatOption = (
  options: { value: string | number; label: string }[],
  value?: string | number
) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  const option = options.find((item) => item.value === value)
  return option ? option.label : value
}

/** 是否使用 ns= 索引写法 */
const isNamespaceIndexBased = (nodeId?: string) => !!nodeId && nodeId.startsWith('ns=')

// ======================= 连接配置 =======================
const opcUaConfig = ref<DeviceOpcUaConfigVO>({} as DeviceOpcUaConfigVO)

/** 是否为不受支持的历史配置：匿名认证、None 安全策略或非 SignAndEncrypt 模式 */
const isUnsupportedConfig = computed(
  () =>
    !!opcUaConfig.value.id &&
    (opcUaConfig.value.authType !== OpcUaAuthTypeEnum.USERNAME ||
      opcUaConfig.value.securityPolicy === 'None' ||
      opcUaConfig.value.securityMode !== OpcUaSecurityModeEnum.SIGN_AND_ENCRYPT)
)

/** 获取连接配置 */
const getOpcUaConfig = async () => {
  opcUaConfig.value =
    (await DeviceOpcUaConfigApi.getOpcUaConfig(props.device.id)) || ({} as DeviceOpcUaConfigVO)
}

/** 编辑连接配置 */
const configFormRef = ref()
const handleEditConfig = () => {
  configFormRef.value?.open(opcUaConfig.value)
}

// ======================= 点位配置 =======================
const pointLoading = ref(false)
const pointList = ref<DeviceOpcUaPointVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  deviceId: props.device.id,
  nodeId: undefined as string | undefined,
  collectMode: undefined as number | undefined
})

/** 获取点位分页 */
const getPointPage = async () => {
  pointLoading.value = true
  try {
    const data = await DeviceOpcUaPointApi.getOpcUaPointPage(queryParams)
    pointList.value = data.list
    total.value = data.total
  } finally {
    pointLoading.value = false
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getPointPage()
}

/** 重置搜索 */
const resetQuery = () => {
  queryParams.nodeId = undefined
  queryParams.collectMode = undefined
  handleQuery()
}

/** 新增点位 */
const pointFormRef = ref()
const handleAddPoint = () => {
  pointFormRef.value?.open('create')
}

/** 编辑点位 */
const handleEditPoint = (row: DeviceOpcUaPointVO) => {
  pointFormRef.value?.open('update', row.id)
}

/** 删除点位 */
const handleDeletePoint = async (row: DeviceOpcUaPointVO) => {
  try {
    // 删除的二次确认
    await message.delConfirm('确定要删除点位【' + (row.name || row.nodeId) + '】吗？')
    // 发起删除
    await DeviceOpcUaPointApi.deleteOpcUaPoint(row.id!)
    message.success('删除成功')
    // 刷新列表
    await getPointPage()
  } catch {}
}

/** 初始化 */
onMounted(async () => {
  await getOpcUaConfig()
  await getPointPage()
})
</script>
