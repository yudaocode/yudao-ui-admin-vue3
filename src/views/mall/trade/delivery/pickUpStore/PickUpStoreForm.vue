<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="60%">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="门店 logo" prop="logo">
            <UploadImg v-model="formData.logo" :limit="1" :is-show-tip="false" />
            <div style="font-size: 10px" class="pl-10px">推荐 180x180 图片分辨率</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="门店状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="门店名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入门店名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="门店手机" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入门店手机" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="门店简介" prop="introduction">
        <el-input
          v-model="formData.introduction"
          :rows="3"
          type="textarea"
          placeholder="请输入门店简介"
        />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="门店所在地区" prop="areaId">
            <el-cascader v-model="formData.areaId" :options="areaList" :props="defaultProps" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="门店详细地址" prop="detailAddress">
            <el-input v-model="formData.detailAddress" placeholder="请输入门店详细地址" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="营业开始时间" prop="openingTime">
            <el-time-select
              v-model="formData.openingTime"
              :max-time="formData.closingTime"
              placeholder="开始时间"
              start="08:30"
              step="00:15"
              end="23:30"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="营业结束时间" prop="closingTime">
            <el-time-select
              v-model="formData.closingTime"
              :min-time="formData.openingTime"
              placeholder="结束时间"
              start="08:30"
              step="00:15"
              end="23:30"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="经度" prop="longitude">
            <el-input v-model="formData.longitude" placeholder="请输入门店经度" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="纬度" prop="latitude">
            <el-input v-model="formData.latitude" placeholder="请输入门店纬度" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="获取经纬度">
        <el-button type="primary" @click="mapDialogVisible = true">获取</el-button>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
    <el-dialog v-model="mapDialogVisible" title="获取经纬度" append-to-body>
      <IFrame class="h-609px" :src="tencentLbsUrl" />
    </el-dialog>
  </Dialog>
</template>
<script setup lang="ts">
import * as DeliveryPickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { defaultProps } from '@/utils/tree'
import { getAreaTree } from '@/api/system/area'
import * as ConfigApi from '@/api/mall/trade/config'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const mapDialogVisible = ref(false) // 地图弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  phone: '',
  logo: '',
  detailAddress: '',
  introduction: '',
  areaId: 0,
  openingTime: undefined,
  closingTime: undefined,
  latitude: undefined,
  longitude: undefined,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  name: [{ required: true, message: '门店名称不能为空', trigger: 'blur' }],
  logo: [{ required: true, message: '门店 logo 不能为空', trigger: 'blur' }],
  phone: [
    { required: true, message: '门店手机不能为空', trigger: 'blur' },
    { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  areaId: [{ required: true, message: '门店所在区域不能为空', trigger: 'blur' }],
  detailAddress: [{ required: true, message: '门店详细地址不能为空', trigger: 'blur' }],
  openingTime: [{ required: true, message: '营业开始时间不能为空', trigger: 'blur' }],
  closingTime: [{ required: true, message: '营业结束时间不能为空', trigger: 'blur' }],
  latitude: [{ required: true, message: '纬度不能为空', trigger: 'blur' }],
  longitude: [{ required: true, message: '经度不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '开启状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const areaList = ref() // 区域树
const tencentLbsUrl = ref('') // 腾讯位置服务 url

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
      formData.value = await DeliveryPickUpStoreApi.getDeliveryPickUpStore(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as DeliveryPickUpStoreApi.DeliveryPickUpStoreVO
    if (formType.value === 'create') {
      await DeliveryPickUpStoreApi.createDeliveryPickUpStore(data)
      message.success(t('common.createSuccess'))
    } else {
      await DeliveryPickUpStoreApi.updateDeliveryPickUpStore(data)
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
    name: '',
    phone: '',
    logo: '',
    detailAddress: '',
    introduction: '',
    areaId: undefined,
    openingTime: undefined,
    closingTime: undefined,
    latitude: undefined,
    longitude: undefined,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}

/** 选择经纬度 */
const selectAddress = function (loc: any): void {
  if (loc.latlng && loc.latlng.lat) {
    formData.value.latitude = loc.latlng.lat
  }
  if (loc.latlng && loc.latlng.lng) {
    formData.value.longitude = loc.latlng.lng
  }
  mapDialogVisible.value = false
}

/** 初始化腾讯地图 */
const initTencentLbsMap = async () => {
  window.selectAddress = selectAddress
  window.addEventListener(
    'message',
    function (event) {
      // 接收位置信息，用户选择确认位置点后选点组件会触发该事件，回传用户的位置信息
      let loc = event.data
      if (loc && loc.module === 'locationPicker') {
        // 防止其他应用也会向该页面 post 信息，需判断 module 是否为 'locationPicker'
        window.parent.selectAddress(loc)
      }
    },
    false
  )
  const data = await ConfigApi.getTradeConfig()
  const key = data.tencentLbsKey
  tencentLbsUrl.value = `https://apis.map.qq.com/tools/locpicker?type=1&key=${key}&referer=myapp`
}

/** 初始化 **/
onMounted(async () => {
  areaList.value = await getAreaTree()
  // 加载地图
  await initTencentLbsMap()
})
</script>
