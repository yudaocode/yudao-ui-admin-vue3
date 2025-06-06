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
      <el-form-item label="DeviceKey" prop="deviceKey">
        <el-input
          v-model="formData.deviceKey"
          placeholder="请输入 DeviceKey"
          :disabled="formType === 'update'"
        >
          <template #append>
            <el-button @click="generateDeviceKey" :disabled="formType === 'update'">
              重新生成
            </el-button>
          </template>
        </el-input>
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
import { DeviceTypeEnum, ProductApi, ProductVO } from '@/api/iot/product/product'
import { UploadImg } from '@/components/UploadFile'
import { generateRandomStr } from '@/utils'

/** IoT 设备表单 */
defineOptions({ name: 'IoTDeviceForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  productId: undefined,
  deviceKey: undefined as string | undefined,
  deviceName: undefined,
  nickname: undefined,
  picUrl: undefined,
  gatewayId: undefined,
  deviceType: undefined as number | undefined,
  serialNumber: undefined,
  groupIds: [] as number[]
})
const formRules = reactive({
  productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  deviceKey: [
    { required: true, message: 'DeviceKey 不能为空', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9]+$/,
      message: 'DeviceKey 只能包含字母和数字',
      trigger: 'blur'
    }
  ],
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
      validator: (rule, value, callback) => {
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

  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DeviceApi.getDevice(id)
    } finally {
      formLoading.value = false
    }
  } else {
    generateDeviceKey()
  }

  // 加载网关设备列表
  try {
    gatewayDevices.value = await DeviceApi.getSimpleDeviceList(DeviceTypeEnum.GATEWAY)
  } catch (error) {
    console.error('加载网关设备列表失败:', error)
  }
  // 加载产品列表
  products.value = await ProductApi.getSimpleProductList()

  // 加载设备分组列表
  try {
    deviceGroups.value = await DeviceGroupApi.getSimpleDeviceGroupList()
  } catch (error) {
    console.error('加载设备分组列表失败:', error)
  }
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
    deviceKey: undefined,
    deviceName: undefined,
    nickname: undefined,
    picUrl: undefined,
    gatewayId: undefined,
    deviceType: undefined,
    serialNumber: undefined,
    groupIds: []
  }
  formRef.value?.resetFields()
}

/** 产品选择变化 */
const handleProductChange = (productId: number) => {
  if (!productId) {
    formData.value.deviceType = undefined
    return
  }
  const product = products.value?.find((item) => item.id === productId)
  formData.value.deviceType = product?.deviceType
}

/** 生成 DeviceKey */
const generateDeviceKey = () => {
  formData.value.deviceKey = generateRandomStr(16)
}
</script>
