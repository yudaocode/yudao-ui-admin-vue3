<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="860px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <!-- DONE @AI：字段布局按 WM 表单统一为三列 -->
          <el-form-item label="仓库编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入仓库编码" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入仓库名称" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="负责人" prop="chargeUserId">
            <el-select
              v-model="formData.chargeUserId"
              placeholder="请选择负责人"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.nickname"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库地址" prop="address">
            <el-input v-model="formData.address" placeholder="请输入仓库地址" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="面积（㎡）" prop="area">
            <el-input-number
              v-model="formData.area"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="是否冻结" prop="frozen">
            <el-switch v-model="formData.frozen" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <!-- DONE @AI：本版不接入条码预览，保留简化弹窗操作区 -->
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'WarehouseForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const userList = ref<UserApi.UserVO[]>([])
const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  address: undefined,
  area: undefined,
  chargeUserId: undefined,
  frozen: false,
  remark: undefined
})
const formRules = reactive({
  code: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }],
  frozen: [{ required: true, message: '是否冻结不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  userList.value = await UserApi.getSimpleUserList()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmWarehouseApi.getWarehouse(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmWarehouseVO
    if (formType.value === 'create') {
      await WmWarehouseApi.createWarehouse(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmWarehouseApi.updateWarehouse(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    code: undefined,
    name: undefined,
    address: undefined,
    area: undefined,
    chargeUserId: undefined,
    frozen: false,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
