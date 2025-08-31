<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="产品" prop="productId">
        <el-select
          v-model="formData.productId"
          placeholder="请选择产品"
          :disabled="formType === 'update'"
          clearable
          @change="handleProductChange"
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
          v-model="formData.deviceName"
          placeholder="请输入 DeviceName"
          :disabled="formType === 'update'"
        />
      </el-form-item>
      <el-form-item
        v-if="formData.deviceType === DeviceTypeEnum.GATEWAY_SUB"
        label="网关设备"
        prop="gatewayId"
      >
        <el-select v-model="formData.gatewayId" placeholder="子设备可选择父设备" clearable>
          <el-option
            v-for="gateway in gatewayDevices"
            :key="gateway.id"
            :label="gateway.nickname || gateway.deviceName"
            :value="gateway.id"
          />
        </el-select>
      </el-form-item>

      <el-collapse>
        <el-collapse-item title="更多配置">
          <el-form-item label="备注名称" prop="nickname">
            <el-input v-model="formData.nickname" placeholder="请输入备注名称" />
          </el-form-item>
          <el-form-item label="设备图片" prop="picUrl">
            <UploadImg v-model="formData.picUrl" :height="'120px'" :width="'120px'" />
          </el-form-item>
          <el-form-item label="设备分组" prop="groupIds">
            <el-select v-model="formData.groupIds" placeholder="请选择设备分组" multiple clearable>
              <el-option
                v-for="group in deviceGroups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="设备序列号" prop="serialNumber">
            <el-input v-model="formData.serialNumber" placeholder="请输入设备序列号" />
          </el-form-item>
          <el-form-item label="定位类型" prop="locationType">
            <el-radio-group v-model="formData.locationType">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.IOT_LOCATION_TYPE)"
                :key="dict.value"
                :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <!-- LocationTypeEnum.MANUAL：手动定位 -->
          <template v-if="LocationTypeEnum.MANUAL === formData.locationType">
            <el-form-item label="设备经度" prop="longitude" type="number">
              <el-input
                v-model="formData.longitude"
                placeholder="请输入设备经度"
                @blur="updateLocationFromCoordinates"
              />
            </el-form-item>
            <el-form-item label="设备维度" prop="latitude" type="number">
              <el-input
                v-model="formData.latitude"
                placeholder="请输入设备维度"
                @blur="updateLocationFromCoordinates"
              />
            </el-form-item>
            <div class="pl-0 h-[400px] w-full ml-[-18px]" v-if="showMap">
              <Map
                :isWrite="true"
                :clickMap="true"
                :center="formData.location"
                @locate-change="handleLocationChange"
                ref="mapRef"
                class="h-full w-full"
              />
            </div>
          </template>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DeviceApi, DeviceVO } from '@/api/iot/device/device'
import { DeviceGroupApi } from '@/api/iot/device/group'
import { DeviceTypeEnum, LocationTypeEnum, ProductApi, ProductVO } from '@/api/iot/product/product'
import { UploadImg } from '@/components/UploadFile'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import Map from '@/components/Map/index.vue'
import { ref } from 'vue'

/** IoT 设备表单 */
defineOptions({ name: 'IoTDeviceForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const showMap = ref(false) // 是否显示地图组件
const mapRef = ref(null)

const formData = ref({
  id: undefined,
  productId: undefined,
  deviceName: undefined,
  nickname: undefined,
  picUrl: undefined,
  gatewayId: undefined,
  deviceType: undefined as number | undefined,
  serialNumber: undefined,
  locationType: undefined as number | undefined,
  longitude: undefined,
  latitude: undefined,
  location: '', // 格式: "经度,纬度"
  groupIds: [] as number[]
})

/** 监听经纬度变化，更新location */
watch([() => formData.value.longitude, () => formData.value.latitude], ([newLong, newLat]) => {
  if (newLong && newLat) {
    formData.value.location = `${newLong},${newLat}`
    // 有了经纬度数据后显示地图
    showMap.value = true
  }
})

const formRules = reactive({
  productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  deviceName: [
    { required: true, message: 'DeviceName 不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_.\-:@]{4,32}$/,
      message:
        '支持英文字母、数字、下划线（_）、中划线（-）、点号（.）、半角冒号（:）和特殊字符@，长度限制为 4~32 个字符',
      trigger: 'blur'
    }
  ],
  nickname: [
    {
      validator: (_rule, value: any, callback) => {
        if (value === undefined || value === null) {
          callback()
          return
        }
        const length = value.replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, 'aa').length
        if (length < 4 || length > 64) {
          callback(new Error('备注名称长度限制为 4~64 个字符，中文及日文算 2 个字符'))
        } else if (!/^[\u4e00-\u9fa5\u3040-\u30ff_a-zA-Z0-9]+$/.test(value)) {
          callback(new Error('备注名称只能包含中文、英文字母、日文、数字和下划线（_）'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  serialNumber: [
    {
      pattern: /^[a-zA-Z0-9-_]+$/,
      message: '序列号只能包含字母、数字、中划线和下划线',
      trigger: 'blur'
    }
  ]
})
const formRef = ref() // 表单 Ref
const products = ref<ProductVO[]>([]) // 产品列表
const gatewayDevices = ref<DeviceVO[]>([]) // 网关设备列表
const deviceGroups = ref<any[]>([])

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  // 默认不显示地图，等待数据加载
  showMap.value = false

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DeviceApi.getDevice(id)

      // 如果有经纬度，设置 location 字段用于地图显示
      if (formData.value.longitude && formData.value.latitude) {
        formData.value.location = `${formData.value.longitude},${formData.value.latitude}`
      }
    } finally {
      formLoading.value = false
    }
  }
  // 如果有经纬信息，则数据加载完成后，显示地图
  showMap.value = true

  // 加载网关设备列表
  gatewayDevices.value = await DeviceApi.getSimpleDeviceList(DeviceTypeEnum.GATEWAY)
  // 加载产品列表
  products.value = await ProductApi.getSimpleProductList()
  // 加载设备分组列表
  deviceGroups.value = await DeviceGroupApi.getSimpleDeviceGroupList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DeviceVO
    // 如果非手动定位，不进行提交该字段
    if (data.locationType !== LocationTypeEnum.MANUAL) {
      data.longitude = undefined
      data.latitude = undefined
    }
    // TODO @宗超：【设备定位】address 和 areaId 也要处理；
    // 1. 手动定位时：longitude + latitude + areaId + address：要稍微注意，address 可能要去掉省市区部分？！
    // 2. IP 定位时：IotDeviceMessage 的 buildStateUpdateOnline 时，增加 ip 字段。这样，解析到 areaId；另外看看能不能通过 https://lbsyun.baidu.com/faq/api?title=webapi/ip-api-base（只获取 location 就 ok 啦）
    // 3. 设备定位时：问问 haohao，一般怎么做。

    if (formType.value === 'create') {
      await DeviceApi.createDevice(data)
      message.success(t('common.createSuccess'))
    } else {
      await DeviceApi.updateDevice(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    productId: undefined,
    deviceName: undefined,
    nickname: undefined,
    picUrl: undefined,
    gatewayId: undefined,
    deviceType: undefined,
    serialNumber: undefined,
    locationType: undefined,
    longitude: undefined,
    latitude: undefined,
    // TODO @宗超：【设备定位】location 是不是拿出来，不放在 formData 里
    location: '',
    groupIds: []
  }
  formRef.value?.resetFields()
  // 重置表单时，隐藏地图
  showMap.value = false
}

/** 产品选择变化 */
const handleProductChange = (productId: number) => {
  if (!productId) {
    formData.value.deviceType = undefined
    return
  }
  const product = products.value?.find((item) => item.id === productId)
  formData.value.deviceType = product?.deviceType
  formData.value.locationType = product?.locationType
}

/** 处理位置变化 */
const handleLocationChange = (lnglat) => {
  formData.value.longitude = lnglat[0]
  formData.value.latitude = lnglat[1]
}

/** 根据经纬度更新地图位置 */
const updateLocationFromCoordinates = () => {
  // 验证经纬度是否有效
  if (formData.value.longitude && formData.value.latitude) {
    // 更新 location 字段，地图组件会根据此字段更新
    formData.value.location = `${formData.value.longitude},${formData.value.latitude}`
    mapRef.value.regeoCode(formData.value.location)
  }
}
</script>
