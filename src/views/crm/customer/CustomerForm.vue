<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="客户名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="跟进状态" prop="followUpStatus">
        <el-radio-group v-model="formData.followUpStatus">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="锁定状态" prop="lockStatus">
        <el-radio-group v-model="formData.lockStatus">
          <el-radio
            v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="手机" prop="mobile">
        <el-input v-model="formData.mobile" placeholder="请输入手机" />
      </el-form-item>
      <el-form-item label="电话" prop="telephone">
        <el-input v-model="formData.telephone" placeholder="请输入电话" />
      </el-form-item>
      <el-form-item label="网址" prop="website">
        <el-input v-model="formData.website" placeholder="请输入网址" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item label="负责人的用户编号" prop="ownerUserId">
        <el-input v-model="formData.ownerUserId" placeholder="请输入负责人的用户编号" />
      </el-form-item>
      <el-form-item label="只读权限的用户编号数组" prop="roUserIds">
        <el-input v-model="formData.roUserIds" placeholder="请输入只读权限的用户编号数组" />
      </el-form-item>
      <el-form-item label="读写权限的用户编号数组" prop="rwUserIds">
        <el-input v-model="formData.rwUserIds" placeholder="请输入读写权限的用户编号数组" />
      </el-form-item>
      <el-form-item label="地区编号" prop="areaId">
        <el-input v-model="formData.areaId" placeholder="请输入地区编号" />
      </el-form-item>
      <el-form-item label="详细地址" prop="detailAddress">
        <el-input v-model="formData.detailAddress" placeholder="请输入详细地址" />
      </el-form-item>
      <el-form-item label="地理位置经度" prop="longitude">
        <el-input v-model="formData.longitude" placeholder="请输入地理位置经度" />
      </el-form-item>
      <el-form-item label="地理位置维度" prop="latitude">
        <el-input v-model="formData.latitude" placeholder="请输入地理位置维度" />
      </el-form-item>
      <el-form-item label="最后跟进时间" prop="contactLastTime">
        <el-date-picker
          v-model="formData.contactLastTime"
          type="date"
          value-format="x"
          placeholder="选择最后跟进时间"
        />
      </el-form-item>
      <el-form-item label="下次联系时间" prop="contactNextTime">
        <el-date-picker
          v-model="formData.contactNextTime"
          type="date"
          value-format="x"
          placeholder="选择下次联系时间"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getBoolDictOptions } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: undefined,
  followUpStatus: undefined,
  lockStatus: undefined,
  mobile: undefined,
  telephone: undefined,
  website: undefined,
  remark: undefined,
  ownerUserId: undefined,
  roUserIds: undefined,
  rwUserIds: undefined,
  areaId: undefined,
  detailAddress: undefined,
  longitude: undefined,
  latitude: undefined,
  contactLastTime: undefined,
  contactNextTime: undefined
})
const formRules = reactive({
  name: [{ require: true, message: '跟进状态不能为空', trigger: 'blur' }],
  followUpStatus: [{ required: true, message: '跟进状态不能为空', trigger: 'blur' }],
  lockStatus: [{ required: true, message: '锁定状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

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
      formData.value = await CustomerApi.getCustomer(id)
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
    const data = formData.value as unknown as CustomerApi.CustomerVO
    if (formType.value === 'create') {
      await CustomerApi.createCustomer(data)
      message.success(t('common.createSuccess'))
    } else {
      await CustomerApi.updateCustomer(data)
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
    name: undefined,
    followUpStatus: undefined,
    lockStatus: undefined,
    mobile: undefined,
    telephone: undefined,
    website: undefined,
    remark: undefined,
    ownerUserId: undefined,
    roUserIds: undefined,
    rwUserIds: undefined,
    areaId: undefined,
    detailAddress: undefined,
    longitude: undefined,
    latitude: undefined,
    contactLastTime: undefined,
    contactNextTime: undefined
  }
  formRef.value?.resetFields()
}
</script>
