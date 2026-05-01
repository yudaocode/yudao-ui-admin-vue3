<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
      :disabled="isDetail"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入仓库编码">
              <template #append>
                <el-button @click="generateCode"> 生成 </el-button>
              </template>
            </el-input>
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
      <el-button v-if="isDetail && formData.id" type="primary" plain @click="handleBarcode">
        查看条码
      </el-button>
      <el-button v-if="!isDetail" @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </el-button>
      <el-button @click="dialogVisible = false">{{ isDetail ? '关 闭' : '取 消' }}</el-button>
    </template>
  </Dialog>
  <!-- 条码详情弹窗（详情模式下展示） -->
  <BarcodeDetail ref="barcodeDetailRef" />
</template>

<script setup lang="ts">
import { WmWarehouseApi, WmWarehouseVO } from '@/api/mes/wm/warehouse'
import { AutoCodeRecordApi } from '@/api/mes/md/autocode/record'
import * as UserApi from '@/api/system/user'
import { MesAutoCodeRuleCode, BarcodeBizTypeEnum } from '@/views/mes/utils/constants'
import { BarcodeDetail } from '@/views/mes/wm/barcode/components'

defineOptions({ name: 'WarehouseForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '新增仓库',
    update: '编辑仓库',
    detail: '仓库详情'
  }
  return titles[formType.value] || formType.value
})
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改；detail - 详情
const isDetail = computed(() => formType.value === 'detail') // 是否详情模式（只读）
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

/** 生成仓库编码 */
const generateCode = async () => {
  formData.value.code = await AutoCodeRecordApi.generateAutoCode(
    MesAutoCodeRuleCode.WM_WAREHOUSE_CODE
  )
}

const formData = ref({
  id: undefined,
  code: undefined,
  name: undefined,
  address: undefined,
  area: undefined,
  chargeUserId: undefined,
  frozen: false,
  remark: undefined
}) // 表单数据
const formRules = reactive({
  code: [{ required: true, message: '仓库编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }],
  frozen: [{ required: true, message: '是否冻结不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const barcodeDetailRef = ref() // 条码详情弹窗 Ref

/** 查看条码 */
const handleBarcode = () => {
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id!, BarcodeBizTypeEnum.WAREHOUSE, formData.value.code, formData.value.name
  )
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  formType.value = type
  resetForm()
  // 加载用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmWarehouseApi.getWarehouse(id)
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
  await formRef.value.validate()
  // 提交请求
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
