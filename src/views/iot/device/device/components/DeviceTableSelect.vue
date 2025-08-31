<!-- IoT 设备选择，使用弹窗展示 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" :appendToBody="true" width="60%">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="100px"
      >
        <el-form-item v-if="!props.productId" label="产品" prop="productId">
          <el-select
            v-model="queryParams.productId"
            placeholder="请选择产品"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="product in products"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="DeviceName" prop="deviceName">
          <el-input
            v-model="queryParams.deviceName"
            placeholder="请输入 DeviceName"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="备注名称" prop="nickname">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入备注名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select
            v-model="queryParams.deviceType"
            placeholder="请选择设备类型"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择设备状态"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DEVICE_STATE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备分组" prop="groupId">
          <el-select
            v-model="queryParams.groupId"
            placeholder="请选择设备分组"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="group in deviceGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        :show-overflow-tooltip="true"
        :stripe="true"
        @row-click="handleRowClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="multiple" type="selection" width="55" />
        <el-table-column v-else width="55">
          <template #default="scope">
            <el-radio
              v-model="selectedId"
              :value="scope.row.id"
              @change="() => handleRadioChange(scope.row)"
            >
              &nbsp;
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column label="DeviceName" align="center" prop="deviceName" />
        <el-table-column label="备注名称" align="center" prop="nickname" />
        <el-table-column label="所属产品" align="center" prop="productId">
          <template #default="scope">
            {{ products.find((p) => p.id === scope.row.productId)?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="设备类型" align="center" prop="deviceType">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column label="所属分组" align="center" prop="groupId">
          <template #default="scope">
            <template v-if="scope.row.groupIds?.length">
              <el-tag v-for="id in scope.row.groupIds" :key="id" class="ml-5px" size="small">
                {{ deviceGroups.find((g) => g.id === id)?.name }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="设备状态" align="center" prop="status">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          label="最后上线时间"
          align="center"
          prop="onlineTime"
          :formatter="dateFormatter"
          width="180px"
        />
      </el-table>

      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>

    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { ProductApi, ProductVO } from '@/api/iot/product/product'
import { DeviceGroupApi, DeviceGroupVO } from '@/api/iot/device/group'

defineOptions({ name: 'IoTDeviceTableSelect' })

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  productId: {
    type: Number,
    default: null
  }
})

const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('设备选择器')
const formLoading = ref(false)
const loading = ref(true) // 列表的加载中
const list = ref<DeviceVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedDevices = ref<DeviceVO[]>([]) // 选中的设备列表
const selectedId = ref<number>() // 单选模式下选中的ID
const products = ref<ProductVO[]>([]) // 产品列表
const deviceGroups = ref<DeviceGroupVO[]>([]) // 设备分组列表

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  deviceName: undefined,
  productId: undefined,
  deviceType: undefined,
  nickname: undefined,
  status: undefined,
  groupId: undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    if (props.productId) {
      queryParams.productId = props.productId as unknown as any
    }
    const data = await DeviceApi.getDevicePage(queryParams)
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

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  // 重置选择状态
  selectedDevices.value = []
  selectedId.value = undefined
  if (!props.productId) {
    // 获取产品列表
    products.value = await ProductApi.getSimpleProductList()
  }
  // 获取设备列表
  await getList()
}
defineExpose({ open })

/** 处理行点击事件 */
const tableRef = ref()
const handleRowClick = (row: DeviceVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
  } else {
    selectedId.value = row.id
    selectedDevices.value = [row]
  }
}

/** 处理单选变更事件 */
const handleRadioChange = (row: DeviceVO) => {
  selectedDevices.value = [row]
}

/** 处理选择变更事件 */
const handleSelectionChange = (selection: DeviceVO[]) => {
  if (props.multiple) {
    selectedDevices.value = selection
  }
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (selectedDevices.value.length === 0) {
    message.warning(props.multiple ? '请至少选择一个设备' : '请选择一个设备')
    return
  }
  emit('success', props.multiple ? selectedDevices.value : selectedDevices.value[0])
  dialogVisible.value = false
}

/** 初始化 **/
onMounted(async () => {
  // 获取分组列表
  deviceGroups.value = await DeviceGroupApi.getSimpleDeviceGroupList()
})
</script>
